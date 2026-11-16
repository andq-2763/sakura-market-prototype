# Function Specifications — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - Function specifications` (No: BM-QT-1701-32, v1.1). Mỗi hàm theo sheet `Function_Name`: Return type · Function name · Arguments (type, name, role) · Description · Variables. Hàm DB là hàm PL/pgSQL (ADR-003); tất cả `SECURITY INVOKER`, chỉ role `app_service` có `EXECUTE`.

## History of changes

| No | Ver | Action | Sheet | Description | Change Date | Editor |
|---|---|---|---|---|---|---|
| 1 | 0.1 | Add New | FS-01〜FS-12 | Tạo mới | 2026-11-15 | An (+ Claude) |

## Danh sách

| ID | Function | Dùng bởi | Detail Design | Có ở prototype? |
|---|---|---|---|---|
| FS-01 | `fn_business_day` | mọi hàm | ADR-005 | ✅ giữ nguyên |
| FS-02 | `fn_next_code` | LOT/TRD/CR/ACC | ADR-012 | ⬜ mới (thay count+1) |
| FS-03 | `fn_audit` | mọi hàm ghi | BR-13 | ✅ giữ, thêm `business_day` |
| FS-04 | `fn_check_eligibility` | TRD, SER, DEL, PTY-07 | DD-01 | 🟡 thay `fn_qualification_problem` |
| FS-05 | `fn_aitai_create_confirm` | TRD-02 | DD-02 | 🟡 thay `fn_create_trade`+`fn_confirm_trade` |
| FS-06 | `fn_seri_record` / `fn_seri_approve` / `fn_seri_reject` | SER-01〜03 | DD-03 | 🟡 |
| FS-07 | `fn_incentive_amount` | DD-07 bước 6 | DD-07 | 🟡 logic từ `incentive-calculation.ts` chuyển sang SQL |
| FS-08 | `fn_calculate_incentive` | INC-03 | DD-07 | ⬜ (prototype làm ở API route) |
| FS-09 | `fn_record_delivery` / `fn_resolve_delivery` | DEL-02/03 | DD-04 | 🟡 |
| FS-10 | `fn_lock_business_day` / `fn_reopen_request` / `fn_reopen_decide` | STL-02〜04 | DD-05 | 🟡 |
| FS-11 | `fn_approve_correction` | COR-03, COR-06 (dry-run) | DD-06 | 🟡 |
| FS-12 | `fn_resolve_rate` / `fn_rate_decide` / `fn_rate_rollback` | INC, RAT-04/05 | DD-08 | ⬜ |

---

### FS-01

| Return type | Function name |
|---|---|
| `date` | `fn_business_day` |

| Argument type | Argument name | Role |
|---|---|---|
| `timestamptz` | `ts` (default `now()`) | Thời điểm cần quy đổi |

**Description:** `((ts AT TIME ZONE 'Asia/Tokyo') - interval '2 hours')::date`. STABLE. 01:59 JST → ngày trước.

### FS-02

| Return type | Function name |
|---|---|
| `text` | `fn_next_code` |

| Argument type | Argument name | Role |
|---|---|---|
| `text` | `p_type` | `LOT` / `TRD` / `CR` / `ACC` / `RATE` |
| `date` | `p_day` | Ngày nghiệp vụ (CR, RATE: dùng ngày 1/1 của năm) |

**Description:** `INSERT INTO code_sequences … ON CONFLICT (code_type, business_day) DO UPDATE SET last_no = code_sequences.last_no + 1 RETURNING last_no`, rồi format: `L{YYMMDD}-{000}`, `T{YYMMDD}-{0000}`, `CR-{YYYY}-{00000}`, `ACC-{YYYYMMDD}-{00}`, số bản料率 = `last_no`.

| Variable type | Variable name | Role |
|---|---|---|
| `integer` | `v_no` | Số vừa cấp |

### FS-03

| Return type | Function name |
|---|---|
| `void` | `fn_audit` |

| Argument type | Argument name | Role |
|---|---|---|
| `uuid` | `p_actor` | Người thực hiện (null = batch) |
| `text` | `p_action` | Ví dụ `相対取引確定`, `修正承認`, `PII_READ` |
| `text` | `p_entity`, `p_entity_id` | Loại + mã nghiệp vụ |
| `jsonb` | `p_before`, `p_after` | Trước / sau |
| `text` | `p_reason` | Lý do (bắt buộc với thao tác nhạy cảm — hàm gọi kiểm tra) |

**Description:** INSERT `audit_logs` kèm `actor_email` (sao chép) và `business_day = fn_business_day(now())`. Không bao giờ gọi ngoài transaction nghiệp vụ.

### FS-04

| Return type | Function name |
|---|---|
| `TABLE(eligible boolean, basis text, status text, certificate_no text, valid_to date, days_left int, error_code text)` | `fn_check_eligibility` |

| Argument type | Argument name | Role |
|---|---|---|
| `bigint` | `p_party_id` | Người mua |
| `date` | `p_day` | Ngày nghiệp vụ của giao dịch / ngày giao |

**Description:** DD-01. STABLE.

| Variable type | Variable name | Role |
|---|---|---|
| `text` | `v_type`, `v_basis` | Loại người tham gia → căn cứ bắt buộc (BR-01) |
| `party_qualifications` | `q` | Dòng áp dụng |

### FS-05

| Return type | Function name |
|---|---|
| `trades` | `fn_aitai_create_confirm` |

| Argument type | Argument name | Role |
|---|---|---|
| `text` | `p_lot_code` | |
| `text` | `p_buyer_code` | |
| `numeric(10,1)` | `p_qty` | > 0 |
| `integer` | `p_unit_price` | ≥ 0 |
| `uuid` | `p_actor` | 取引担当 |
| `uuid` | `p_client_uuid` | Idempotency-Key |

**Description:** DD-02. Raise `P0001` với message `E-TRD-01/02`, `E-ELG-01/02/03`, `E-LOT-01/02`.

| Variable type | Variable name | Role |
|---|---|---|
| `date` | `v_day` | `fn_business_day(now())` |
| `lots` | `l` | Lô đã khóa `FOR UPDATE` |
| `record` | `e` | Kết quả FS-04 |
| `text` | `v_code` | FS-02 |

### FS-07 (bản tham chiếu đã chạy thử)

| Return type | Function name |
|---|---|
| `bigint` | `fn_incentive_amount` (IMMUTABLE) |

| Argument type | Argument name | Role |
|---|---|---|
| `bigint` | `eligible` | 適格金額 (税抜, có thể âm) |
| `bigint` | `billed` | 請求額 từ kế toán (null = 未取込) |
| `bigint` | `paid_by_due` | Tổng đã trả đến hết ngày hạn |
| `int` | `rate_bp`, `bigint threshold`, `int tn`, `int td` | Từ bản料率 |

```sql
create or replace function fn_incentive_amount(eligible bigint, billed bigint, paid_by_due bigint,
  rate_bp int, threshold bigint, tn int, td int) returns bigint language sql immutable as $$
  select case when eligible > 0 and billed is not null and paid_by_due >= billed and eligible >= threshold
    then floor(eligible::numeric * rate_bp * tn / (10000::numeric * td))::bigint else 0 end $$;
```

Dùng `numeric` (không float) — prototype dùng số nguyên JS `Math.floor(eligible*rateBp*taxNum/(10000*taxDen))`, đúng nhưng có thể vượt `Number.MAX_SAFE_INTEGER` khi 適格金額 > ~5.5 tỉ yên/kỳ (không thực tế, nhưng SQL loại bỏ hẳn rủi ro).

### FS-08

| Return type | Function name |
|---|---|
| `TABLE(mode text, rate_version int, due_date date, rows int, total bigint)` | `fn_calculate_incentive` |

| Argument type | Argument name | Role |
|---|---|---|
| `char(7)` | `p_period` | YYYY-MM |
| `uuid` | `p_actor` | |
| `boolean` | `p_confirm_missing_billing` | Cho phép chạy khi có người tham gia 未取込 |

**Description:** DD-07 bước 1〜7. Mỗi bước là hàm nội bộ `_inc_*` để test riêng.

### FS-09〜FS-12

| ID | Return | Name | Arguments | Description |
|---|---|---|---|---|
| FS-09 | `trades` | `fn_record_delivery` | `p_trade_code text, p_qty numeric, p_exception text, p_reason text, p_device_time timestamptz, p_actor uuid, p_client_uuid uuid` | DD-04 |
| FS-09 | `deliveries` | `fn_resolve_delivery` | `p_delivery_id bigint, p_action text, p_comment text, p_actor uuid` | DD-04 bước 6 |
| FS-10 | `business_days` | `fn_lock_business_day` | `p_day date, p_actor uuid` | DD-05 |
| FS-10 | `business_days` | `fn_reopen_request` / `fn_reopen_decide` | `p_day, p_reason / p_decision, p_actor` | DD-05 |
| FS-11 | `SETOF trade_entries` | `fn_approve_correction` | `p_code text, p_actor uuid, p_comment text, p_dry_run boolean default false` | DD-06; `dry_run` cho COR-06 preview (ROLLBACK cuối) |
| FS-12 | `rate_versions` | `fn_resolve_rate` | `p_day date` | DD-08 |
| FS-12 | `rate_versions` | `fn_rate_decide` | `p_no int, p_decision text, p_comment text, p_actor uuid` | DD-08 |
| FS-12 | `TABLE(period char(7))` | `fn_rate_rollback` | `p_no int, p_reason text, p_actor uuid` | Trả các kỳ bị ảnh hưởng |
