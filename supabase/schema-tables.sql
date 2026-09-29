-- 桜水産市場 業務支援システム プロトタイプ: テーブル定義
-- 実行: npm run db:setup（schema-tables → schema-functions → seed の順で適用）
-- 全テーブルで RLS を有効化しポリシーは作らない: ブラウザの anon/authenticated キーからは読めず、
-- Next.js の API route（service role）だけがアクセスする。

drop table if exists audit_logs, incentive_results, payments, rate_versions, corrections, deliveries,
  trades, business_days, lots, items, shippers, party_qualifications, parties, role_permissions, profiles cascade;

-- 利用者・権限 ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null check (role in ('ROLE-INTAKE','ROLE-JUDGE','ROLE-TRADE','ROLE-DELIVERY',
    'ROLE-SETTLEMENT','ROLE-APPROVER','ROLE-RULE-ADMIN','ROLE-SYS-ADMIN')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table role_permissions (
  role text not null,
  permission text not null,
  primary key (role, permission)
);

-- 参加者と参加資格（許可・承認・市場登録を別の根拠として保持） --------------
create table parties (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  party_type text not null check (party_type in ('卸売業者','仲卸','売買参加者','買出人')),
  email text,
  created_at timestamptz not null default now()
);

create table party_qualifications (
  id bigint generated always as identity primary key,
  party_id bigint not null references parties(id) on delete cascade,
  basis text not null check (basis in ('市場登録','許可','承認','取引地点登録')),
  certificate_no text not null,
  valid_from date not null,
  valid_to date not null, -- 最終有効日（この業務日の終了まで有効）
  suspended boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  check (valid_to >= valid_from)
);

-- マスタ ----------------------------------------------------------------------
create table shippers (id bigint generated always as identity primary key, code text not null unique, name text not null);
create table items (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  unit text not null check (unit in ('kg','箱','尾'))
);

-- 業務日（02:00 JST 起点）と締め ----------------------------------------------
create table business_days (
  day date primary key,
  locked boolean not null default false,
  locked_by uuid references profiles(id),
  locked_at timestamptz
);

-- ロット -------------------------------------------------------------------------
create table lots (
  id bigint generated always as identity primary key,
  lot_code text not null unique,
  business_day date not null references business_days(day),
  shipper_id bigint not null references shippers(id),
  item_id bigint not null references items(id),
  initial_qty numeric(10,1) not null check (initial_qty > 0),
  available_qty numeric(10,1) not null check (available_qty >= 0), -- BR-LOT-02 負数禁止
  status text not null default '受付' check (status in ('受付','下見済','公開','売買確定','引渡し完了')),
  judge_result text check (judge_result in ('特選','上','並','規格外')),
  judged_by uuid references profiles(id),
  judged_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 取引（相対・せり共通。赤黒の訂正も同じ表に行として追加） ------------------
create table trades (
  id bigint generated always as identity primary key,
  trade_code text not null unique,
  trade_type text not null check (trade_type in ('相対','せり')),
  business_day date not null references business_days(day),
  lot_id bigint not null references lots(id),
  buyer_party_id bigint not null references parties(id),
  qty numeric(10,1) not null,
  unit_price integer not null check (unit_price >= 0),
  amount bigint not null,
  status text not null default '下書き' check (status in ('下書き','確認待ち','確定','取消')),
  delivery_status text not null default '待機中' check (delivery_status in ('待機中','引渡し中','完了','例外','対象外')),
  entry_kind text not null default '通常' check (entry_kind in ('通常','赤','黒')),
  adjusts_trade_id bigint references trades(id),
  correction_id bigint,
  seri_time time,
  cancel_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz
);
create index trades_day_idx on trades(business_day);
create index trades_buyer_idx on trades(buyer_party_id);

create table deliveries (
  id bigint generated always as identity primary key,
  trade_id bigint not null references trades(id),
  seq integer not null,
  qty numeric(10,1) not null check (qty >= 0),
  exception_type text check (exception_type in ('不足','超過','返却','部分キャンセル')),
  reason text,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz not null default now(),
  unique (trade_id, seq)
);

-- 確定後修正（FORM-CORR-01） ----------------------------------------------------
create table corrections (
  id bigint generated always as identity primary key,
  correction_code text not null unique,
  trade_id bigint not null references trades(id),
  new_qty numeric(10,1) not null check (new_qty >= 0),
  new_unit_price integer not null check (new_unit_price >= 0),
  reason text not null,
  evidence_note text,
  status text not null default '承認待ち' check (status in ('承認待ち','承認','却下','追加情報要求')),
  requested_by uuid not null references profiles(id),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_comment text
);
alter table trades add constraint trades_correction_fk foreign key (correction_id) references corrections(id);

-- 完納奨励金の料率版・入金・計算結果 -----------------------------------------------
create table rate_versions (
  id bigint generated always as identity primary key,
  version_no integer not null unique,
  effective_from date not null,
  rate_bp integer not null check (rate_bp between 0 and 10000), -- 交付率（ベーシスポイント: 150 = 1.50%）
  threshold_amount bigint not null default 0,  -- 最低閾値（以上で対象）
  tax_numerator integer not null default 110,  -- 税係数 110/100（BR-INC-01）
  tax_denominator integer not null default 100,
  payment_due_days integer not null default 10, -- 期末から支払期日までの日数
  status text not null default '草案' check (status in ('草案','承認済','ロールバック')),
  note text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rolled_back_by uuid references profiles(id),
  rolled_back_at timestamptz,
  check (approved_by is null or approved_by <> created_by)
);

create table payments (
  id bigint generated always as identity primary key,
  party_id bigint not null references parties(id),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  paid_amount bigint not null check (paid_amount >= 0),
  paid_on date not null,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz not null default now()
);

create table incentive_results (
  id bigint generated always as identity primary key,
  period text not null,
  party_id bigint not null references parties(id),
  rate_version_id bigint not null references rate_versions(id),
  eligible_amount bigint not null,
  billed_amount bigint not null,
  paid_amount bigint not null,
  due_date date not null,
  last_paid_on date,
  on_time boolean not null,
  incentive_amount bigint not null,
  kind text not null default '本計算' check (kind in ('本計算','次期差分')),
  source_period text,        -- 次期差分の原因となった期
  cause text,
  calculated_by uuid references profiles(id),
  calculated_at timestamptz not null default now()
);

-- 論理監査ログ（追記のみ） --------------------------------------------------------
create table audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references profiles(id),
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text
);
create index audit_logs_entity_idx on audit_logs(entity, entity_id);
create index audit_logs_at_idx on audit_logs(at desc);

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
