-- 桜水産市場 業務支援システム: 設計DDL v1.0 (LAB-4) — specs/02_System-Architecture/01_High-Level-Design/03_Database-Design.md から生成
-- PostgreSQL 16。業務関数・トリガー・CHECK の詳細は Detail Design を参照。

create table accounts ( -- アカウント
  id uuid not null, -- アカウントID：Cognito sub と同値
  email varchar(254) not null unique, -- メール
  display_name varchar(100) not null, -- 表示名
  employee_no varchar(20), -- 社員番号
  role varchar(30) not null, -- ロール：roles.code
  acting_approver_until date, -- 承認代理：A4-08。この日まで承認権限
  status varchar(10) not null default '有効', -- 状態：有効/停止/ロック
  mfa_required boolean not null default false, -- MFA必須：ロールから自動設定
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create index accounts_role_idx on accounts (role);
create table roles ( -- ロール
  code varchar(30) not null, -- ロールコード：ROLE-INTAKE …
  name varchar(50) not null, -- 名称
  mfa_required boolean not null default false, -- MFA必須
  primary key (code)
);
create table role_permissions ( -- ロール権限
  role varchar(30) not null, -- ロール
  permission varchar(40) not null, -- 権限：trade.write など
  primary key (role, permission)
);
create table market_calendar ( -- 市場カレンダー
  day date not null, -- 日付
  is_open boolean not null default true, -- 開市
  note varchar(100), -- 備考
  primary key (day)
);
create table items ( -- 品目
  id bigint generated always as identity not null, -- ID
  code varchar(10) not null unique, -- 品目コード
  name varchar(50) not null, -- 品目名
  unit varchar(5) not null, -- 販売単位：kg/箱/尾
  primary key (id)
);
create table shippers ( -- 荷主・船
  id bigint generated always as identity not null, -- ID
  code varchar(10) not null unique, -- 荷主コード
  name varchar(100) not null, -- 名称
  primary key (id)
);
create table code_sequences ( -- コード採番
  code_type varchar(10) not null, -- コード種別：LOT/TRD/CR/ACC
  business_day date not null, -- 業務日
  last_no integer not null default 0, -- 最終番号
  primary key (code_type, business_day)
);
create table parties ( -- 参加者
  id bigint generated always as identity not null, -- ID
  code varchar(10) not null unique, -- 参加者コード
  name varchar(100) not null, -- 名称
  party_type varchar(10) not null, -- 参加区分：CHECK 4区分
  email varchar(254), -- メール：通知用
  limit_amount bigint, -- 参加上限額：Q-18: 表示のみ
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table party_qualifications ( -- 参加資格
  id bigint generated always as identity not null, -- ID
  party_id bigint not null, -- 参加者ID
  basis varchar(10) not null, -- 参加根拠：BR-01: 区分と一致
  certificate_no varchar(30) not null, -- 証番号
  valid_from date not null, -- 有効開始日
  valid_to date not null, -- 最終有効日：Q-19
  status varchar(10) not null default '申請', -- 状態：SM-01
  status_reason varchar(200), -- 状態理由
  approved_by uuid, -- 承認者：≠ created_by
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create index pq_party_basis_idx on party_qualifications (party_id, basis, valid_to);
create table lots ( -- ロット
  id bigint generated always as identity not null, -- ID
  lot_code varchar(12) not null unique, -- ロットコード：L{YYMMDD}-{000}
  business_day date not null, -- 業務日
  shipper_id bigint not null, -- 荷主ID
  item_id bigint not null, -- 品目ID
  initial_qty numeric(10,1) not null, -- 初期数量：> 0
  available_qty numeric(10,1) not null, -- 利用可能数量：CHECK >= 0（BR-03）
  status varchar(10) not null default '受付', -- 状態：SM-02（販売準備を追加）
  judge_result varchar(10), -- 評価結果：人が選択（BR-11）
  judged_by uuid, -- 評価者：ROLE-JUDGE
  judged_at timestamptz, -- 評価時刻
  client_uuid uuid unique, -- 端末送信ID：オフライン重複防止
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create index lots_day_status_idx on lots (business_day, status);
create table lot_qty_ledger ( -- ロット数量台帳
  id bigint generated always as identity not null, -- ID
  lot_id bigint not null, -- ロットID
  delta numeric(10,1) not null, -- 増減
  reason_type varchar(10) not null, -- 事由：受付/確定/取消/赤黒/調整
  trade_id bigint, -- 取引ID
  reason varchar(200), -- 理由：調整時必須
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table trades ( -- 取引
  id bigint generated always as identity not null, -- ID
  trade_code varchar(12) not null unique, -- 取引コード：T{YYMMDD}-{0000}
  trade_type varchar(4) not null, -- 取引種別：相対/せり
  business_day date not null, -- 業務日
  lot_id bigint not null, -- ロットID
  buyer_party_id bigint not null, -- 買手ID
  qty numeric(10,1) not null, -- 数量（原始）：> 0
  unit_price integer not null, -- 単価（原始）：>= 0 円
  status varchar(6) not null, -- 状態：確認待ち/差戻し/確定/取消
  delivery_status varchar(6) not null default '対象外', -- 引渡し状態：SM-05
  seri_time time, -- せり時刻：せりのみ
  seri_session_id bigint, -- せりセッション：SCR-050
  cancel_reason varchar(200), -- 取消理由
  reject_reason varchar(200), -- 差戻し理由
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  confirmed_by uuid, -- 確定者：せり: ≠ created_by
  confirmed_at timestamptz, -- 確定時刻
  primary key (id)
);
create index trades_day_idx on trades (business_day);
create index trades_buyer_idx on trades (buyer_party_id, business_day);
create index trades_lot_idx on trades (lot_id);
create table trade_entries ( -- 取引明細（赤黒台帳）
  id bigint generated always as identity not null, -- ID
  trade_id bigint not null, -- 取引ID
  entry_no smallint not null, -- 明細番号：1=原始
  entry_type varchar(2) not null, -- 明細種別：原始/赤/黒
  business_day date not null, -- 計上業務日：赤黒は修正承認日
  qty numeric(10,1) not null, -- 数量：赤は負
  unit_price integer not null, -- 単価
  amount bigint not null, -- 金額：floor(qty×unit_price)
  correction_id bigint, -- 修正依頼ID：赤黒のみ
  reverses_entry_no smallint, -- 取消対象明細：赤のみ
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create unique index te_trade_entry_uq on trade_entries (trade_id, entry_no);
create index te_day_idx on trade_entries (business_day);
create table seri_sessions ( -- せりセッション
  id bigint generated always as identity not null, -- ID
  business_day date not null, -- 業務日
  starts_at time not null, -- 開始予定
  place varchar(30), -- 場所
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table deliveries ( -- 引渡し
  id bigint generated always as identity not null, -- ID
  trade_id bigint not null, -- 取引ID
  seq smallint not null, -- 回次
  qty numeric(10,1) not null, -- 数量：>= 0
  exception_type varchar(8), -- 例外種別：不足/超過/返却/部分キャンセル/資格確認
  reason varchar(200), -- 理由：例外時必須
  resolved_by uuid, -- 解消者：≠ recorded_by（BR-11）
  resolved_at timestamptz, -- 解消時刻
  device_time timestamptz, -- 端末時刻：オフライン
  client_uuid uuid unique, -- 端末送信ID
  recorded_by uuid not null, -- 記録者
  recorded_at timestamptz not null default now(), -- 記録時刻
  primary key (id)
);
create unique index deliveries_trade_seq_uq on deliveries (trade_id, seq);
create table disputes ( -- 紛争
  id bigint generated always as identity not null, -- ID
  trade_id bigint not null, -- 取引ID
  status varchar(6) not null default '対応中', -- 状態：対応中/解決/取下げ
  cause varchar(200) not null, -- 原因
  owner_id uuid not null, -- 担当者
  due_date date, -- 予定日
  result varchar(200), -- 結果
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table business_days ( -- 業務日
  day date not null, -- 業務日
  status varchar(8) not null default '営業中', -- 状態：営業中/ロック済/再開申請中/公開済
  locked_by uuid, -- ロック者
  locked_at timestamptz, -- ロック時刻
  reopen_reason varchar(200), -- 再開申請理由
  reopen_requested_by uuid, -- 再開申請者
  primary key (day)
);
create table corrections ( -- 修正依頼
  id bigint generated always as identity not null, -- ID
  correction_code varchar(14) not null unique, -- 修正依頼コード：CR-{YYYY}-{00000}
  trade_id bigint not null, -- 取引ID
  target_business_day date not null, -- 対象業務日
  new_qty numeric(10,1) not null, -- 新数量
  new_unit_price integer not null, -- 新単価
  reason varchar(500) not null, -- 理由
  affects_settlement boolean not null, -- 精算・引渡し影響：true なら証拠添付必須
  status varchar(8) not null default '承認待ち', -- 状態：SM-07
  requested_by uuid not null, -- 申請者
  requested_at timestamptz not null default now(), -- 申請時刻
  reviewed_by uuid, -- 審査者：≠ requested_by
  reviewed_at timestamptz, -- 審査時刻
  review_comment varchar(500), -- 審査コメント：却下・追加情報要求で必須
  primary key (id)
);
create table rate_versions ( -- 料率版
  id bigint generated always as identity not null, -- ID
  version_no integer not null unique, -- 版番号
  effective_from date not null, -- 発効日：> 起票時の業務日
  rate_bp integer not null, -- 交付率(bp)：0〜10000
  threshold_amount bigint not null default 0, -- 最低閾値：以上で対象
  tax_numerator smallint not null default 110, -- 税係数 分子：Q-06
  tax_denominator smallint not null default 100, -- 税係数 分母
  payment_due_days smallint not null, -- 支払日数：期末+N日（当日含む）
  status varchar(8) not null default '草案', -- 状態：SM-09
  change_reason varchar(500) not null, -- 変更理由
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  approved_by uuid, -- 承認者：≠ created_by
  approved_at timestamptz, -- 承認時刻
  rolled_back_by uuid, -- ロールバック者
  rolled_back_at timestamptz, -- ロールバック時刻
  rollback_reason varchar(500), -- ロールバック理由
  primary key (id)
);
create table payment_imports ( -- 入金取込
  id bigint generated always as identity not null, -- ID
  file_name varchar(200) not null, -- ファイル名
  s3_key varchar(300) not null, -- S3キー
  row_count integer not null, -- 件数
  status varchar(6) not null, -- 状態：取込済/エラー
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table payment_lines ( -- 入金明細
  id bigint generated always as identity not null, -- ID
  import_id bigint, -- 取込ID：手入力は null
  party_id bigint not null, -- 参加者ID
  period char(7) not null, -- 対象期：YYYY-MM
  billed_amount bigint not null, -- 請求額：会計から（A4-04）
  paid_amount bigint not null, -- 入金額：>= 0
  paid_on date not null, -- 入金日
  manual_reason varchar(200), -- 補正理由：手入力時必須
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create index pl_party_period_idx on payment_lines (party_id, period);
create table incentive_periods ( -- 奨励金期
  period char(7) not null, -- 対象期
  status varchar(6) not null default '未計算', -- 状態：未計算/計算済/確定
  rate_version_id bigint, -- 適用料率版
  closed_by uuid, -- 確定者
  closed_at timestamptz, -- 確定時刻
  primary key (period)
);
create table incentive_results ( -- 奨励金結果
  id bigint generated always as identity not null, -- ID
  period char(7) not null, -- 対象期：次期差分は計上先の期
  party_id bigint not null, -- 参加者ID
  rate_version_id bigint not null, -- 料率版ID：FR-AUDIT-03
  eligible_amount bigint not null, -- 適格金額：税抜合計
  billed_amount bigint not null, -- 請求額
  paid_by_due bigint not null, -- 期日内入金額
  last_paid_on date, -- 最終入金日：期日超過の説明用
  due_date date not null, -- 支払期日
  on_time boolean not null, -- 完納
  incentive_amount bigint not null, -- 奨励金額
  kind varchar(4) not null, -- 区分：本計算/次期差分
  source_period char(7), -- 発生元期
  cause varchar(200), -- 原因
  calculated_by uuid not null, -- 計算者
  calculated_at timestamptz not null default now(), -- 計算時刻
  superseded_at timestamptz, -- 置換日時：再計算で置換された本計算（v1.1・BR-16）
  primary key (id)
);
create index ir_period_party_idx on incentive_results (period, party_id);
create table acc_export_batches ( -- 会計連携バッチ
  batch_code varchar(16) not null, -- バッチコード：ACC-YYYYMMDD-NN
  business_day date not null, -- 業務日
  row_count integer not null, -- 件数
  total_amount bigint not null, -- 合計額
  sha256 char(64) not null, -- ハッシュ
  status varchar(8) not null, -- 送信状態：送信済/失敗/差替済
  attempts smallint not null default 0, -- 試行回数
  created_at timestamptz not null default now(), -- 作成日時
  primary key (batch_code)
);
create table attachments ( -- 添付ファイル
  id bigint generated always as identity not null, -- ID
  entity varchar(20) not null, -- 対象種別：lot/delivery/correction
  entity_id bigint not null, -- 対象ID
  s3_key varchar(300) not null, -- S3キー
  kind varchar(10) not null, -- 種類：受入票/写真/証拠
  storage_class varchar(8) not null default '標準', -- 保管区分：標準/コールド
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table notifications ( -- 通知
  id bigint generated always as identity not null, -- ID
  event varchar(40) not null, -- イベント
  severity varchar(8) not null, -- 重要度：Critical/通常
  channel varchar(5) not null, -- チャネル：app/mail
  recipient varchar(254) not null, -- 宛先
  payload jsonb not null, -- 内容
  status varchar(6) not null default '待機', -- 状態：待機/送信済/既読/最終失敗
  attempts smallint not null default 0, -- 試行回数：最大3
  created_at timestamptz not null default now(), -- 作成日時
  primary key (id)
);
create table audit_logs ( -- 監査ログ
  id bigint generated always as identity not null, -- ID
  at timestamptz not null default now(), -- 日時
  actor_id uuid, -- 実行者：batch は null
  actor_email varchar(254), -- 実行者メール：アカウント停止後も追跡できるよう複製
  action varchar(40) not null, -- 操作
  entity varchar(30) not null, -- 対象種別
  entity_id varchar(30), -- 対象ID：業務コード
  before jsonb, -- 変更前
  after jsonb, -- 変更後
  reason varchar(500), -- 理由
  business_day date not null default fn_business_day(now()), -- 業務日：検索用
  primary key (id)
);
create index audit_entity_idx on audit_logs (entity, entity_id);
create index audit_day_idx on audit_logs (business_day, action);
create table sync_submissions ( -- 同期受付
  client_uuid uuid not null, -- 端末送信ID
  operation varchar(20) not null, -- 操作：lot.create/delivery.record
  result varchar(6) not null, -- 結果：成功/競合/拒否
  entity_id bigint, -- 対象ID
  conflict jsonb, -- 競合内容
  device_id varchar(40) not null, -- 端末ID
  created_by uuid not null, -- 作成者：accounts.id
  created_at timestamptz not null default now(), -- 作成日時
  primary key (client_uuid)
);
create table job_runs ( -- ジョブ実行
  id bigint generated always as identity not null, -- ID
  job_id varchar(10) not null, -- ジョブID：BAT-01…
  business_day date, -- 対象業務日
  status varchar(6) not null, -- 状態：実行中/成功/失敗
  started_at timestamptz not null default now(), -- 開始
  finished_at timestamptz, -- 終了
  error text, -- エラー
  primary key (id)
);

alter table accounts add constraint accounts_role_fk foreign key (role) references roles(code);
alter table role_permissions add constraint role_permissions_role_fk foreign key (role) references roles(code);
alter table party_qualifications add constraint pq_party_fk foreign key (party_id) references parties(id);
alter table lots add constraint lots_shipper_fk foreign key (shipper_id) references shippers(id);
alter table lots add constraint lots_item_fk foreign key (item_id) references items(id);
alter table lot_qty_ledger add constraint lql_lot_fk foreign key (lot_id) references lots(id);
alter table trades add constraint trades_lot_fk foreign key (lot_id) references lots(id);
alter table trades add constraint trades_buyer_fk foreign key (buyer_party_id) references parties(id);
alter table trade_entries add constraint te_trade_fk foreign key (trade_id) references trades(id);
alter table trade_entries add constraint te_corr_fk foreign key (correction_id) references corrections(id);
alter table deliveries add constraint deliveries_trade_fk foreign key (trade_id) references trades(id);
alter table corrections add constraint corrections_trade_fk foreign key (trade_id) references trades(id);

-- 業務規則の CHECK（抜粋。BR-xx は 01_Requirement-Specification/02_Business-Rules-and-State-Machines.md）
alter table lots add constraint lots_available_nonneg check (available_qty >= 0 and available_qty <= initial_qty); -- BR-03
alter table parties add constraint parties_type_chk check (party_type in ('卸売業者','仲卸','売買参加者','買出人'));
alter table party_qualifications add constraint pq_valid_range check (valid_to >= valid_from);
alter table party_qualifications add constraint pq_status_chk check (status in ('申請','有効','一時停止','期限切れ','失効','再審査'));
alter table trades add constraint trades_type_chk check (trade_type in ('相対','せり'));
alter table trades add constraint trades_status_chk check (status in ('確認待ち','差戻し','確定','取消'));
alter table trades add constraint trades_seri_sod check (trade_type <> 'せり' or confirmed_by is null or confirmed_by <> created_by); -- BR-12
alter table trade_entries add constraint te_type_chk check (entry_type in ('原始','赤','黒'));
alter table deliveries add constraint del_exception_reason check (exception_type is null or reason is not null); -- BR-07
alter table corrections add constraint corr_sod check (reviewed_by is null or reviewed_by <> requested_by); -- BR-12
alter table rate_versions add constraint rv_sod check (approved_by is null or approved_by <> created_by); -- BR-10
alter table rate_versions add constraint rv_rate_range check (rate_bp between 0 and 10000);
