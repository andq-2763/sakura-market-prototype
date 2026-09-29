-- 業務ルールをトランザクション内で実行するDB関数（行ロックで同時確定時の過剰販売を防ぐ）
-- API route から service role でのみ呼び出す（末尾で anon/authenticated の実行権限を剥奪）

-- 業務日: JST 02:00 起点。暦日 00:00-01:59 は前業務日に属する
create or replace function fn_business_day(ts timestamptz default now()) returns date
language sql stable as $$ select ((ts at time zone 'Asia/Tokyo') - interval '2 hours')::date $$;

create or replace function fn_audit(p_actor uuid, p_action text, p_entity text, p_entity_id text,
  p_before jsonb, p_after jsonb, p_reason text default null) returns void
language sql as $$
  insert into audit_logs(actor_id, actor_email, action, entity, entity_id, before, after, reason)
  values (p_actor, (select email from profiles where id = p_actor), p_action, p_entity, p_entity_id, p_before, p_after, p_reason)
$$;

-- 参加区分ごとの参加根拠を判定（BR-PERM-01）。問題なければ null、あれば理由を返す
create or replace function fn_qualification_problem(p_party_id bigint, p_day date) returns text
language plpgsql stable as $$
declare v_type text; v_basis text; q party_qualifications;
begin
  select party_type into v_type from parties where id = p_party_id;
  if v_type is null then return '参加者が存在しません'; end if;
  v_basis := case v_type when '卸売業者' then '市場登録' when '仲卸' then '許可'
                         when '売買参加者' then '承認' else '取引地点登録' end;
  select * into q from party_qualifications
   where party_id = p_party_id and basis = v_basis and valid_from <= p_day
   order by (p_day <= valid_to) desc, valid_from desc, valid_to desc limit 1;
  if not found then return format('%s（%s）の%sがありません', v_type, v_basis, '有効な登録'); end if;
  if q.suspended then return format('%s（%s）は一時停止中です', v_basis, q.certificate_no); end if;
  if q.valid_to < p_day then return format('%sの有効期限切れ（最終有効日 %s）', v_basis, q.valid_to); end if;
  return null;
end $$;

create or replace function fn_assert_day_open(p_day date) returns void
language plpgsql as $$
begin
  if exists (select 1 from business_days where day = p_day and locked) then
    raise exception 'ロック済み業務日（%）のため操作できません', p_day;
  end if;
end $$;

-- 取引確定（相対は下書き→確定、せりは確認待ち→確定。せりは入力者≠確認者）
create or replace function fn_confirm_trade(p_trade_id bigint, p_actor uuid) returns trades
language plpgsql as $$
declare t trades; l lots; v_problem text;
begin
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception '取引が見つかりません'; end if;
  if t.trade_type = '相対' and t.status <> '下書き' then raise exception '下書きの取引のみ確定できます（現在: %）', t.status; end if;
  if t.trade_type = 'せり' and t.status <> '確認待ち' then raise exception '確認待ちのせり結果のみ確定できます（現在: %）', t.status; end if;
  if t.trade_type = 'せり' and t.created_by = p_actor then raise exception '入力者本人はせり結果を確認できません（職務分離）'; end if;
  perform fn_assert_day_open(t.business_day);
  v_problem := fn_qualification_problem(t.buyer_party_id, t.business_day);
  if v_problem is not null then raise exception '参加資格エラー: %', v_problem; end if;
  select * into l from lots where id = t.lot_id for update;
  if l.status not in ('公開', '売買確定') then raise exception 'ロット % は販売可能な状態ではありません（現在: %）', l.lot_code, l.status; end if;
  if l.available_qty < t.qty then
    raise exception '数量不足: ロット % の利用可能数量 % に対して % は確定できません', l.lot_code, l.available_qty, t.qty;
  end if;
  update lots set available_qty = available_qty - t.qty, status = '売買確定' where id = l.id;
  update trades set status = '確定', confirmed_by = p_actor, confirmed_at = now(), amount = floor(t.qty * t.unit_price)
   where id = t.id returning * into t;
  perform fn_audit(p_actor, '取引確定', 'trade', t.trade_code, jsonb_build_object('status', '下書き/確認待ち', 'lot_available', l.available_qty),
    jsonb_build_object('status', t.status, 'lot_available', l.available_qty - t.qty));
  return t;
end $$;

-- 未ロック業務日の取引取消（FR-AITAI-03）。確定済みなら利用可能数量を戻す
create or replace function fn_cancel_trade(p_trade_id bigint, p_actor uuid, p_reason text) returns trades
language plpgsql as $$
declare t trades; v_prev text;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception '取消理由は必須です'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception '取引が見つかりません'; end if;
  if t.status = '取消' then raise exception '既に取消済みです'; end if;
  if t.entry_kind <> '通常' then raise exception '赤黒レコードは取消できません'; end if;
  perform fn_assert_day_open(t.business_day);
  if exists (select 1 from deliveries where trade_id = t.id) then raise exception '引渡し記録がある取引は取消できません'; end if;
  v_prev := t.status;
  if t.status = '確定' then
    update lots set available_qty = available_qty + t.qty where id = t.lot_id;
    update lots set status = '公開' where id = t.lot_id
       and not exists (select 1 from trades where lot_id = t.lot_id and status = '確定' and id <> t.id);
  end if;
  update trades set status = '取消', delivery_status = '対象外', cancel_reason = p_reason where id = t.id returning * into t;
  perform fn_audit(p_actor, '取引取消', 'trade', t.trade_code, jsonb_build_object('status', v_prev), jsonb_build_object('status', '取消'), p_reason);
  return t;
end $$;

-- 引渡し記録（分割可）。確認数量が取引数量と一致したときのみ完了（BR-DEL-03）
create or replace function fn_record_delivery(p_trade_id bigint, p_qty numeric, p_exception text, p_reason text, p_actor uuid)
returns trades language plpgsql as $$
declare t trades; v_target numeric; v_delivered numeric; v_seq int; v_status text;
begin
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception '取引が見つかりません'; end if;
  if t.status <> '確定' or t.entry_kind <> '通常' then raise exception '確定済みの取引のみ引渡しを記録できます'; end if;
  if t.delivery_status = '完了' then raise exception '引渡しは既に完了しています'; end if;
  if p_exception is not null and coalesce(trim(p_reason), '') = '' then raise exception '例外には理由が必要です'; end if;
  if p_exception is null and p_qty <= 0 then raise exception '引渡し数量を入力してください'; end if;
  -- 承認済み修正があれば黒レコードの数量を引渡し対象数量とする
  select coalesce((select qty from trades where adjusts_trade_id = t.id and entry_kind = '黒' order by id desc limit 1), t.qty) into v_target;
  select coalesce(sum(qty), 0) + p_qty, coalesce(max(seq), 0) + 1 into v_delivered, v_seq from deliveries where trade_id = t.id;
  if v_delivered > v_target and p_exception is null then
    raise exception '累積引渡し数量 % が取引数量 % を超えます。超過は例外として登録してください', v_delivered, v_target;
  end if;
  insert into deliveries(trade_id, seq, qty, exception_type, reason, recorded_by) values (t.id, v_seq, p_qty, p_exception, p_reason, p_actor);
  v_status := case when p_exception is not null then '例外' when v_delivered = v_target then '完了' else '引渡し中' end;
  update trades set delivery_status = v_status where id = t.id returning * into t;
  update lots set status = '引渡し完了' where id = t.lot_id and available_qty = 0
     and not exists (select 1 from trades where lot_id = t.lot_id and status = '確定' and entry_kind = '通常' and delivery_status <> '完了');
  perform fn_audit(p_actor, '引渡し記録', 'trade', t.trade_code, null,
    jsonb_build_object('seq', v_seq, 'qty', p_qty, 'delivered', v_delivered, 'target', v_target, 'status', v_status, 'exception', p_exception), p_reason);
  return t;
end $$;

-- 業務日ロック（FR-SETTLE-02）。未確定の取引が残っていればロックしない
create or replace function fn_lock_business_day(p_day date, p_actor uuid) returns business_days
language plpgsql as $$
declare d business_days; v_open int;
begin
  insert into business_days(day) values (p_day) on conflict do nothing;
  select * into d from business_days where day = p_day for update;
  if d.locked then raise exception '業務日 % は既にロック済みです', p_day; end if;
  select count(*) into v_open from trades where business_day = p_day and status in ('下書き', '確認待ち');
  if v_open > 0 then raise exception '未確定の取引が % 件あるためロックできません（確定または取消してください）', v_open; end if;
  update business_days set locked = true, locked_by = p_actor, locked_at = now() where day = p_day returning * into d;
  perform fn_audit(p_actor, '業務日ロック', 'business_day', p_day::text, jsonb_build_object('locked', false), jsonb_build_object('locked', true));
  return d;
end $$;

-- 業務日＋JST時刻 → timestamptz（シードデータ作成用）
create or replace function fn_jst(p_day date, p_time time) returns timestamptz
language sql immutable as $$ select (p_day + p_time) at time zone 'Asia/Tokyo' $$;

-- 取引の作成（＋即時確定）。確定が拒否された場合は作成ごとロールバックされ、取引は残らない（FR-AITAI-02）
create or replace function fn_create_trade(p_type text, p_lot_id bigint, p_buyer bigint, p_qty numeric, p_unit_price integer,
  p_seri_time time, p_confirm boolean, p_actor uuid) returns trades
language plpgsql as $$
declare v_day date := fn_business_day(now()); v_seq int; t trades;
begin
  if p_qty <= 0 then raise exception '数量は0より大きい値を入力してください'; end if;
  insert into business_days(day) values (v_day) on conflict do nothing;
  perform fn_assert_day_open(v_day);
  select count(*) + 1 into v_seq from trades where business_day = v_day and entry_kind = '通常';
  insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status, seri_time, created_by)
  values (format('T%s-%s', to_char(v_day, 'YYMMDD'), lpad(v_seq::text, 3, '0')), p_type, v_day, p_lot_id, p_buyer, p_qty, p_unit_price,
    floor(p_qty * p_unit_price), case when p_type = 'せり' then '確認待ち' else '下書き' end, p_seri_time, p_actor)
  returning * into t;
  perform fn_audit(p_actor, case when p_type = 'せり' then 'せり結果入力' else '相対取引登録' end, 'trade', t.trade_code, null,
    jsonb_build_object('qty', p_qty, 'unit_price', p_unit_price, 'status', t.status));
  if p_confirm then t := fn_confirm_trade(t.id, p_actor); end if;
  return t;
end $$;
