-- モックデータ（架空）: 権限マトリクス、マスタ、参加者と参加資格、料率版
-- profiles は scripts/setup-database.mjs が Supabase Auth のデモユーザー作成後に投入する

insert into role_permissions(role, permission)
select r, p from (values
  ('ROLE-INTAKE', 'lot.write'), ('ROLE-INTAKE', 'lot.judge'),
  ('ROLE-JUDGE', 'lot.judge'),
  ('ROLE-TRADE', 'trade.write'), ('ROLE-TRADE', 'seri.write'), ('ROLE-TRADE', 'seri.approve'), ('ROLE-TRADE', 'correction.request'),
  ('ROLE-DELIVERY', 'delivery.write'),
  ('ROLE-SETTLEMENT', 'settle.lock'), ('ROLE-SETTLEMENT', 'correction.request'), ('ROLE-SETTLEMENT', 'incentive.run'),
  ('ROLE-SETTLEMENT', 'payment.write'), ('ROLE-SETTLEMENT', 'party.write'), ('ROLE-SETTLEMENT', 'report.export'), ('ROLE-SETTLEMENT', 'audit.read'),
  ('ROLE-APPROVER', 'correction.approve'), ('ROLE-APPROVER', 'rate.approve'), ('ROLE-APPROVER', 'seri.approve'),
  ('ROLE-APPROVER', 'audit.read'), ('ROLE-APPROVER', 'report.export'),
  ('ROLE-RULE-ADMIN', 'rate.draft'),
  ('ROLE-SYS-ADMIN', 'admin.users'), ('ROLE-SYS-ADMIN', 'admin.roles'), ('ROLE-SYS-ADMIN', 'audit.read'), ('ROLE-SYS-ADMIN', 'report.export')
) as v(r, p);
-- システム管理者（講師レビュー用）は全業務権限を持つ。職務分離は記録単位でDBが強制する
insert into role_permissions(role, permission)
select 'ROLE-SYS-ADMIN', p from unnest(array['lot.write','lot.judge','trade.write','seri.write','seri.approve','delivery.write',
  'settle.lock','correction.request','correction.approve','incentive.run','payment.write','party.write','rate.draft','rate.approve']) p
on conflict do nothing;

insert into shippers(code, name) values
  ('S01', '第一桜丸'), ('S02', '第三浜風丸'), ('S03', '桜浜漁業協同組合'), ('S04', '港南定置網'), ('S05', '北浜水産');

insert into items(code, name, unit) values
  ('I01', 'まぐろ', 'kg'), ('I02', 'かつお', 'kg'), ('I03', 'さば', '箱'), ('I04', 'あじ', '箱'),
  ('I05', 'ぶり', '尾'), ('I06', 'するめいか', '箱'), ('I07', 'まだい', '尾'), ('I08', 'さんま', '箱');

insert into parties(code, name, party_type, email) values
  ('W01', '桜浜水産株式会社', '卸売業者', 'w01@example.invalid'),
  ('N01', '丸浜商店', '仲卸', 'n01@example.invalid'),
  ('N02', '山二水産', '仲卸', 'n02@example.invalid'),
  ('N03', '海幸（有効期限切れ）', '仲卸', 'n03@example.invalid'),
  ('N04', '魚竹', '仲卸', 'n04@example.invalid'),
  ('N05', '浜の丸友（失効間近）', '仲卸', 'n05@example.invalid'),
  ('B01', 'さくらスーパー', '売買参加者', 'b01@example.invalid'),
  ('B02', '港町フーズ（一時停止中）', '売買参加者', 'b02@example.invalid'),
  ('B03', '桜浜給食センター', '売買参加者', 'b03@example.invalid'),
  ('B04', 'ホテル潮見（失効間近）', '売買参加者', 'b04@example.invalid'),
  ('K01', '寿司 はま田', '買出人', 'k01@example.invalid'),
  ('K02', '割烹 さくら', '買出人', 'k02@example.invalid'),
  ('K03', '鮮魚 まるいち', '買出人', 'k03@example.invalid');

-- 参加資格: 区分ごとに根拠が異なる（卸売業者=市場登録、仲卸=許可、売買参加者=承認、買出人=取引地点登録）
do $$
declare d0 date := fn_business_day(now()); p record; v_basis text; v_to date; v_susp boolean;
begin
  for p in select * from parties order by code loop
    v_basis := case p.party_type when '卸売業者' then '市場登録' when '仲卸' then '許可' when '売買参加者' then '承認' else '取引地点登録' end;
    v_to := case p.code when 'N03' then d0 - 1 when 'N05' then d0 + 12 when 'B04' then d0 + 20 else d0 + 400 end;
    v_susp := p.code = 'B02';
    insert into party_qualifications(party_id, basis, certificate_no, valid_from, valid_to, suspended, note)
    values (p.id, v_basis, format('%s-%s-%s', left(v_basis, 1), p.code, to_char(d0, 'YY')), d0 - 700, v_to, v_susp,
      case p.code when 'B02' then '支払遅延のため一時停止（模擬）' when 'N03' then '更新手続き未了（模擬）' end);
  end loop;
end $$;
