-- 確定後修正（赤黒）とロック済み業務日の保護、実行権限の制御

-- 修正依頼の承認: 元取引は変更せず、赤（取消）と黒（訂正）の取引行を当日の業務日に追加する
create or replace function fn_approve_correction(p_correction_id bigint, p_actor uuid, p_comment text) returns corrections
language plpgsql as $$
declare c corrections; t trades; l lots; v_today date := fn_business_day(now()); v_diff numeric; v_red trades; v_black trades;
begin
  select * into c from corrections where id = p_correction_id for update;
  if not found then raise exception '修正依頼が見つかりません'; end if;
  if c.status <> '承認待ち' then raise exception '承認待ちの依頼のみ承認できます（現在: %）', c.status; end if;
  if c.requested_by = p_actor then raise exception '起票者本人は承認できません（職務分離）'; end if;
  select * into t from trades where id = c.trade_id for update;
  if t.status <> '確定' or t.entry_kind <> '通常' then raise exception '確定済みの通常取引のみ修正できます'; end if;
  if exists (select 1 from corrections where trade_id = t.id and status = '承認' and id <> c.id) then
    raise exception 'この取引には承認済みの修正があります（プロトタイプでは1取引1回まで）';
  end if;
  insert into business_days(day) values (v_today) on conflict do nothing;
  perform fn_assert_day_open(v_today);
  v_diff := c.new_qty - t.qty;
  select * into l from lots where id = t.lot_id for update;
  if l.available_qty - v_diff < 0 then
    raise exception '数量不足: ロット % の利用可能数量 % では % 増やせません', l.lot_code, l.available_qty, v_diff;
  end if;
  update lots set available_qty = available_qty - v_diff where id = l.id;

  insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status,
    delivery_status, entry_kind, adjusts_trade_id, correction_id, created_by, confirmed_by, confirmed_at)
  values (t.trade_code || '-R' || c.id, t.trade_type, v_today, t.lot_id, t.buyer_party_id, -t.qty, t.unit_price, -t.amount, '確定',
    '対象外', '赤', t.id, c.id, c.requested_by, p_actor, now()) returning * into v_red;
  insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status,
    delivery_status, entry_kind, adjusts_trade_id, correction_id, created_by, confirmed_by, confirmed_at)
  values (t.trade_code || '-C' || c.id, t.trade_type, v_today, t.lot_id, t.buyer_party_id, c.new_qty, c.new_unit_price,
    floor(c.new_qty * c.new_unit_price), '確定', '対象外', '黒', t.id, c.id, c.requested_by, p_actor, now()) returning * into v_black;

  update corrections set status = '承認', reviewed_by = p_actor, reviewed_at = now(), review_comment = p_comment
   where id = c.id returning * into c;
  perform fn_audit(p_actor, '修正承認', 'correction', c.correction_code,
    jsonb_build_object('trade', t.trade_code, 'qty', t.qty, 'unit_price', t.unit_price, 'amount', t.amount),
    jsonb_build_object('red', v_red.trade_code, 'black', v_black.trade_code, 'qty', c.new_qty, 'unit_price', c.new_unit_price, 'amount', v_black.amount),
    c.reason);
  return c;
end $$;

-- 修正依頼の却下・追加情報要求
create or replace function fn_review_correction(p_correction_id bigint, p_actor uuid, p_decision text, p_comment text) returns corrections
language plpgsql as $$
declare c corrections;
begin
  if p_decision not in ('却下', '追加情報要求') then raise exception '判定が不正です'; end if;
  if coalesce(trim(p_comment), '') = '' then raise exception 'コメントは必須です'; end if;
  select * into c from corrections where id = p_correction_id for update;
  if not found then raise exception '修正依頼が見つかりません'; end if;
  if c.status <> '承認待ち' then raise exception '承認待ちの依頼のみ判定できます（現在: %）', c.status; end if;
  if c.requested_by = p_actor then raise exception '起票者本人は判定できません（職務分離）'; end if;
  update corrections set status = p_decision, reviewed_by = p_actor, reviewed_at = now(), review_comment = p_comment
   where id = c.id returning * into c;
  perform fn_audit(p_actor, '修正' || p_decision, 'correction', c.correction_code, jsonb_build_object('status', '承認待ち'),
    jsonb_build_object('status', p_decision), p_comment);
  return c;
end $$;

-- ロック済み業務日の取引は直接修正・削除できない（BR-CLOSE-01, FR-CORR-03）。
-- 例外: 引渡し状態（delivery_status）は締め後も引渡しの進捗に応じて更新できる
create or replace function trg_block_locked_trade_change() returns trigger
language plpgsql as $$
declare v trades;
begin
  if exists (select 1 from business_days where day = old.business_day and locked) then
    if tg_op = 'DELETE' then raise exception 'ロック済み業務日（%）の取引は削除できません', old.business_day; end if;
    v := new; v.delivery_status := old.delivery_status;
    if v is distinct from old then
      raise exception 'ロック済み業務日（%）の取引は直接修正できません。修正依頼を起票してください', old.business_day;
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trades_block_locked_change on trades;
create trigger trades_block_locked_change before update or delete on trades
  for each row execute function trg_block_locked_trade_change();

-- 監査ログは追記のみ
create or replace function trg_audit_append_only() returns trigger
language plpgsql as $$ begin raise exception '監査ログは変更・削除できません'; end $$;
drop trigger if exists audit_logs_append_only on audit_logs;
create trigger audit_logs_append_only before update or delete on audit_logs
  for each row execute function trg_audit_append_only();

-- 関数はサーバ（service_role）からのみ実行可能にする
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
