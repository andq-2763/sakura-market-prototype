-- モックデータ（架空）: 業務日・ロット・取引・引渡し・料率版・入金・修正依頼
-- 日付は実行時点の業務日（d0）からの相対日付で作る: 前月3日分（奨励金計算用）＋ 直近4業務日
do $$
declare
  d0 date := fn_business_day(now());
  pm date := (date_trunc('month', fn_business_day(now())) - interval '1 month')::date;
  pm_end date := (date_trunc('month', fn_business_day(now())) - interval '1 day')::date;
  u_intake uuid := (select id from profiles where role = 'ROLE-INTAKE' limit 1);
  u_judge uuid := (select id from profiles where role = 'ROLE-JUDGE' limit 1);
  u_trade uuid := (select id from profiles where role = 'ROLE-TRADE' limit 1);
  u_delivery uuid := (select id from profiles where role = 'ROLE-DELIVERY' limit 1);
  u_settle uuid := (select id from profiles where role = 'ROLE-SETTLEMENT' limit 1);
  u_approver uuid := (select id from profiles where role = 'ROLE-APPROVER' limit 1);
  u_rule uuid := (select id from profiles where role = 'ROLE-RULE-ADMIN' limit 1);
  buyers bigint[] := array(select id from parties where code in ('N01','N02','N04','N05','B01','B03','B04','K01','K02','K03') order by code);
  prices int[] := array[3200, 900, 2800, 3500, 4200, 3000, 1800, 2600];
  grades text[] := array['特選', '上', '並', '上'];
  days date[]; d date; k int; j int; n int; seq int; item_no int; init numeric; q numeric[]; price int;
  v_lot bigint; v_trade bigint; v_type text; t int; v_status text; v_delivered boolean;
begin
  days := array(select distinct x from unnest(array[pm + 4, pm + 11, pm + 18, d0 - 3, d0 - 2, d0 - 1, d0]) x order by x);
  n := array_length(buyers, 1);
  for k in 1 .. array_length(days, 1) loop
    d := days[k]; seq := 0;
    insert into business_days(day) values (d) on conflict do nothing;
    for j in 1 .. (case when d = d0 then 8 else 6 end) loop
      item_no := ((k * 3 + j) % 8) + 1;
      init := 20 + ((k * 7 + j * 13) % 41);
      price := prices[item_no] * (95 + ((k + j) % 10)) / 100;
      v_status := case when d = d0 and j <= 2 then '受付' when d = d0 and j = 3 then '下見済' when d = d0 and j in (4, 5) then '公開' else '売買確定' end;
      insert into lots(lot_code, business_day, shipper_id, item_id, initial_qty, available_qty, status, judge_result, judged_by, judged_at, created_by, created_at)
      values (format('L%s-%s', to_char(d, 'YYMMDD'), lpad(j::text, 3, '0')), d, ((k + j) % 5) + 1,
        (select id from items where code = 'I0' || item_no), init, init, v_status,
        case when v_status = '受付' then null else grades[(j % 4) + 1] end,
        case when v_status = '受付' then null else u_judge end,
        case when v_status = '受付' then null else fn_jst(d, time '03:10') + (j || ' minutes')::interval end,
        u_intake, fn_jst(d, time '02:20') + (j || ' minutes')::interval)
      returning id into v_lot;
      continue when v_status <> '売買確定';

      q := array[floor(init * 0.5), floor(init * 0.3)];
      for t in 1 .. 2 loop
        seq := seq + 1;
        v_type := case when t = 2 and (k + j) % 4 = 0 then 'せり' else '相対' end;
        -- 引渡し: d0-2以前は完了、d0-1は一部が引渡し中・例外、当日は待機中
        v_delivered := d < d0 - 1 or (d = d0 - 1 and t = 1);
        insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status,
          delivery_status, seri_time, created_by, created_at, confirmed_by, confirmed_at)
        values (format('T%s-%s', to_char(d, 'YYMMDD'), lpad(seq::text, 3, '0')), v_type, d, v_lot,
          buyers[((k * 5 + j * 3 + t * 7) % n) + 1], q[t], price, floor(q[t] * price), '確定',
          case when v_delivered then '完了' when d = d0 then '待機中' when j = 5 then '例外' when j % 2 = 0 then '引渡し中' else '待機中' end,
          case when v_type = 'せり' then time '06:30' + (j || ' minutes')::interval end,
          u_trade, fn_jst(d, time '05:00') + (seq || ' minutes')::interval,
          case when v_type = 'せり' then u_approver else u_trade end, fn_jst(d, time '05:05') + (seq || ' minutes')::interval)
        returning id into v_trade;
        if v_delivered and j % 3 = 0 then
          insert into deliveries(trade_id, seq, qty, recorded_by, recorded_at) values
            (v_trade, 1, floor(q[t] * 0.6), u_delivery, fn_jst(d, time '07:00')), (v_trade, 2, q[t] - floor(q[t] * 0.6), u_delivery, fn_jst(d, time '08:40'));
        elsif v_delivered then
          insert into deliveries(trade_id, seq, qty, recorded_by, recorded_at) values (v_trade, 1, q[t], u_delivery, fn_jst(d, time '07:30'));
        elsif d = d0 - 1 and j = 5 then
          insert into deliveries(trade_id, seq, qty, exception_type, reason, recorded_by, recorded_at)
          values (v_trade, 1, q[t] - 2, '不足', '受領時に2箱不足（模擬）', u_delivery, fn_jst(d, time '07:45'));
        elsif d = d0 - 1 and j % 2 = 0 then
          insert into deliveries(trade_id, seq, qty, recorded_by, recorded_at) values (v_trade, 1, floor(q[t] / 2), u_delivery, fn_jst(d, time '07:50'));
        end if;
      end loop;
      update lots set available_qty = init - q[1] - q[2],
        status = case when d < d0 - 1 then '引渡し完了' else '売買確定' end where id = v_lot;
    end loop;
  end loop;

  -- 当日: 下書きの相対取引と、確認待ちのせり結果（確認者の承認デモ用）
  insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status, created_by)
  select format('T%s-%s', to_char(d0, 'YYMMDD'), '901'), '相対', d0, id, buyers[1], 5, 3100, 15500, '下書き', u_trade
    from lots where lot_code = format('L%s-004', to_char(d0, 'YYMMDD'));
  insert into trades(trade_code, trade_type, business_day, lot_id, buyer_party_id, qty, unit_price, amount, status, seri_time, created_by)
  select format('T%s-%s', to_char(d0, 'YYMMDD'), '902'), 'せり', d0, id, buyers[6], 8, 2950, 23600, '確認待ち', time '06:40', u_trade
    from lots where lot_code = format('L%s-005', to_char(d0, 'YYMMDD'));

  -- 料率版: 現行（承認済）と、来月発効の草案（承認デモ用）
  insert into rate_versions(version_no, effective_from, rate_bp, threshold_amount, payment_due_days, status, note, created_by, approved_by, approved_at)
  values (1, date '2025-04-01', 150, 100000, 10, '承認済', '初版（模擬）', u_rule, u_approver, now() - interval '200 days');
  insert into rate_versions(version_no, effective_from, rate_bp, threshold_amount, payment_due_days, status, note, created_by)
  values (2, (date_trunc('month', d0) + interval '1 month')::date, 175, 100000, 10, '草案', '交付率改定案（模擬）', u_rule);

  -- 前月分の入金: 期日内の完納が基本。K02は期日超過、B03は一部入金（奨励金0円のケース）
  insert into payments(party_id, period, paid_amount, paid_on, recorded_by)
  select p.id, to_char(pm, 'YYYY-MM'),
    case p.code when 'B03' then floor(sum(t.amount) * 108 / 100 * 0.8) else floor(sum(t.amount) * 108 / 100) end,
    case p.code when 'K02' then pm_end + 13 else pm_end + 8 end, u_settle
  from trades t join parties p on p.id = t.buyer_party_id
  where t.status = '確定' and t.business_day between pm and pm_end group by p.id, p.code;

  -- 締め: d0-2 以前の業務日をロック
  update business_days set locked = true, locked_by = u_settle, locked_at = fn_jst(day, time '10:30') where day < d0 - 1;

  -- ロック済み業務日の取引に対する承認待ちの修正依頼（赤黒デモ用）
  insert into corrections(correction_code, trade_id, new_qty, new_unit_price, reason, evidence_note, requested_by)
  select 'CR-0001', id, qty - 1, unit_price, '計量誤り: 受領時の再計量で1少なかった（模擬）', '計量記録票の写し（模擬）', u_settle
    from trades where business_day = d0 - 2 and entry_kind = '通常' order by id limit 1;

  insert into audit_logs(actor_id, actor_email, action, entity, entity_id, after, reason)
  values (null, 'system', 'モックデータ投入', 'seed', to_char(d0, 'YYYY-MM-DD'),
    jsonb_build_object('lots', (select count(*) from lots), 'trades', (select count(*) from trades)), '研修用の架空データ');
end $$;
