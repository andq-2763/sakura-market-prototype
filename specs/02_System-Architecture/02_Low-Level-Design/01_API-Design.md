# API Design — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - API Design` (No: BM-QT-1701-30, v1.1). Giữ các sheet: `History of changes` (§1), `Common Conventions` (§2), `Status code` (§3), `API List` (§4), `API_Detail_Template` (§5, mỗi API 1 mục). Template sheet `API_List` của Screen Specification cũng trỏ về đây.

## 1. History of changes

| No | Ver | Action | Sheet | Description | Change Date | Editor |
|---|---|---|---|---|---|---|
| 1 | 1.0 | Add new | All | 58 API (v1), chi tiết 11 API cốt lõi | 2026-11-15 | An (+ Claude) |

## 2. Common Conventions

| No | Convention | Example | Note |
|---|---|---|---|
| 0 | Tất cả response có thể có liệt kê ở mục Responses; mỗi request chỉ trả 1 | — | Template |
| 1 | Mọi param bắt buộc trừ khi ghi [optional] | — | Template |
| 2 | Tuân thủ status code §3 | — | Template |
| 3 | Lỗi trả JSON | `{"errors":[{"error_code":"E-ELG-03","error_description":"…","error_extra":{"valid_to":"2026-11-14"}}]}` | Template; `error_code` theo [Common Message List](../01_High-Level-Design/screens/00_Screen-List.md#2-common-message-list) |
| 4 | Prefix `/api/v1`; tài nguyên định danh bằng **mã nghiệp vụ** (`trade_code`, `lot_code`, `party code`), không lộ `id` số | `GET /api/v1/trades/T261115-0143` | BR-14 |
| 5 | Xác thực: cookie phiên httpOnly (Cognito). Không có API public | — | ADR-010 |
| 6 | Mọi API ghi gọi đúng **1 hàm DB** nghiệp vụ; API không tự UPDATE bảng | — | ADR-003 |
| 7 | API ghi có thể bị gửi lại (mạng chập chờn): header `Idempotency-Key: <uuid>` bắt buộc với TRD-02, SER-01, LOT-02, DEL-02, SYN-01; trùng key → trả lại kết quả lần đầu | — | ADR-007, `sync_submissions` |
| 8 | Ngày nghiệp vụ không bao giờ do client gửi khi ghi; server dùng `fn_business_day(now())` | — | BR-04 |
| 9 | Thời gian trả về ISO 8601 có offset `+09:00`; ngày `YYYY-MM-DD`; tiền là số nguyên JPY; số lượng chuỗi thập phân `"20.0"` | — | Tránh lỗi số thực |
| 10 | Danh sách: `?limit=50&cursor=` | — | |

## 3. Status code

| No | Status code | Description | Dùng khi |
|---|---|---|---|
| 1 | 200 | OK | |
| 2 | 201 | Created | Tạo lô, giao dịch, yêu cầu sửa… |
| 3 | 202 | Accepted | Import CSV, chạy lại IF-ACC (worker xử lý) |
| 4 | 400 | Bad request | Validate định dạng (M_xx) |
| 5 | 401 | Authentication failure | Chưa đăng nhập / hết phiên |
| 6 | 403 | Forbidden | Thiếu permission của vai trò |
| 7 | 404 | Resource not found | |
| 8 | **409** | **Conflict — vi phạm quy tắc nghiệp vụ** | Mọi `E-XXX-NN` từ hàm DB (SQLSTATE P0001) |
| 9 | 500 | Internal Server Error | |
| 10 | 503 | Service Unavailable | Bảo trì ngoài giờ dịch vụ |

## 4. API List

| No | API ID | Category | Screen/Feature | API URL | Detail Description |
|---|---|---|---|---|---|
| 1 | AUTH-01 | 認証 | SCR-001 | POST /api/v1/auth/login | Cognito SRP, trả trạng thái cần MFA |
| 2 | AUTH-02 | 認証 | SCR-002 | POST /api/v1/auth/mfa | Xác minh TOTP |
| 3 | AUTH-03 | 認証 | 共通 | POST /api/v1/auth/logout | |
| 4 | AUTH-04 | 認証 | 共通 | GET /api/v1/me | Người dùng, permissions, `business_day`, `business_day_status` |
| 5 | PTY-01 | 参加者 | SCR-020, 023 | GET /api/v1/parties | `?q=&type=&status=expiring` |
| 6 | PTY-02 | 参加者 | SCR-021 | GET /api/v1/parties/{code} | Profile + qualifications (ghi PII_READ) |
| 7 | PTY-03 | 参加者 | SCR-021 | POST /api/v1/parties | |
| 8 | PTY-04 | 参加者 | SCR-021 | PATCH /api/v1/parties/{code} | |
| 9 | PTY-05 | 参加資格 | SCR-022 | POST /api/v1/parties/{code}/qualifications | Đăng ký → 申請 |
| 10 | PTY-06 | 参加資格 | SCR-022 | POST /api/v1/qualifications/{id}/transitions | approve/reject/suspend/resume/revoke |
| 11 | **PTY-07** | 参加資格 | SCR-040, 052, 061 | GET /api/v1/parties/{code}/eligibility | Hiển thị trước (DD-01) |
| 12 | LOT-01 | ロット | SCR-031 | GET /api/v1/lots | `?day=&status=&q=` |
| 13 | **LOT-02** | ロット | SCR-030 | POST /api/v1/lots | Idempotent |
| 14 | LOT-03 | ロット | SCR-032 | GET /api/v1/lots/{lotCode} | + sổ số lượng |
| 15 | LOT-04 | ロット | SCR-033 | POST /api/v1/lots/{lotCode}/judgement | ROLE-JUDGE |
| 16 | LOT-05 | ロット | SCR-032 | POST /api/v1/lots/{lotCode}/status | 販売準備 / 公開 |
| 17 | LOT-06 | ロット | SCR-034 | POST /api/v1/lots/{lotCode}/adjustments | |
| 18 | TRD-01 | 取引 | SCR-041 | GET /api/v1/trades | `?day=&type=&status=&buyer=&created_by=me` |
| 19 | **TRD-02** | 相対 | SCR-040 | POST /api/v1/trades/aitai | Tạo + xác nhận 1 transaction (DD-02) |
| 20 | TRD-03 | 取引 | SCR-042, 061 | GET /api/v1/trades/{tradeCode} | + entries, deliveries, effective |
| 21 | TRD-04 | 取引 | SCR-042 | POST /api/v1/trades/{tradeCode}/cancel | |
| 22 | SER-01 | せり | SCR-051 | POST /api/v1/trades/seri | → 確認待ち |
| 23 | **SER-02** | せり | SCR-052 | POST /api/v1/trades/{tradeCode}/seri-approve | DD-03 |
| 24 | SER-03 | せり | SCR-052 | POST /api/v1/trades/{tradeCode}/seri-reject | |
| 25 | DEL-01 | 引渡し | SCR-060 | GET /api/v1/deliveries/board | Theo trạng thái, tồn đọng |
| 26 | **DEL-02** | 引渡し | SCR-061 | POST /api/v1/trades/{tradeCode}/deliveries | DD-04 |
| 27 | DEL-03 | 引渡し | SCR-062 | POST /api/v1/deliveries/{id}/resolve | Giải quyết ngoại lệ |
| 28 | STL-01 | 照合 | SCR-070 | GET /api/v1/business-days/{day}/settlement | |
| 29 | **STL-02** | 締め | SCR-072 | POST /api/v1/business-days/{day}/lock | DD-05 |
| 30 | STL-03 | 締め | SCR-072 | POST /api/v1/business-days/{day}/reopen-request | |
| 31 | STL-04 | 締め | SCR-072 | POST /api/v1/business-days/{day}/reopen-decision | |
| 32 | STL-05 | 紛争 | SCR-071 | GET, POST, PATCH /api/v1/disputes | |
| 33 | STL-06 | 締め | SCR-072 | POST /api/v1/business-days/{day}/publish | |
| 34 | COR-01 | 修正 | SCR-080 | GET /api/v1/corrections | |
| 35 | COR-02 | 修正 | SCR-081 | POST /api/v1/corrections | |
| 36 | **COR-03** | 修正 | SCR-082 | POST /api/v1/corrections/{code}/approve | DD-06 |
| 37 | COR-04 | 修正 | SCR-082 | POST /api/v1/corrections/{code}/reject | |
| 38 | COR-05 | 修正 | SCR-082 | POST /api/v1/corrections/{code}/request-info | |
| 39 | COR-06 | 修正 | SCR-082 | GET /api/v1/corrections/{code} | + preview bút toán |
| 40 | **INC-01** | 奨励金 | SCR-090 | POST /api/v1/payment-imports | CSV multipart |
| 41 | INC-02 | 奨励金 | SCR-091 | GET /api/v1/incentive-periods/{period} | |
| 42 | **INC-03** | 奨励金 | SCR-091 | POST /api/v1/incentive-periods/{period}/calculate | DD-07 |
| 43 | INC-04 | 奨励金 | SCR-091 | POST /api/v1/incentive-periods/{period}/close | |
| 44 | RAT-01 | 料率 | SCR-100 | GET /api/v1/rate-versions | + đếm năm tài chính |
| 45 | RAT-02 | 料率 | SCR-101 | POST /api/v1/rate-versions | 草案 |
| 46 | RAT-03 | 料率 | SCR-101 | POST /api/v1/rate-versions/{no}/submit | |
| 47 | **RAT-04** | 料率 | SCR-102 | POST /api/v1/rate-versions/{no}/decision | approve / reject (DD-08) |
| 48 | RAT-05 | 料率 | SCR-102 | POST /api/v1/rate-versions/{no}/rollback | |
| 49 | RPT-01 | 帳票 | SCR-120, PRT | GET /api/v1/reports/{rptId} | CSV/PDF |
| 50 | ACC-01 | 会計連携 | SCR-130 | GET /api/v1/accounting-exports | |
| 51 | ACC-02 | 会計連携 | SCR-130 | POST /api/v1/accounting-exports/{batchCode}/resend | Cần duyệt |
| 52 | AUD-01 | 監査 | SCR-140 | GET /api/v1/audit-logs | |
| 53 | ADM-01/02 | 管理 | SCR-010/011 | GET, POST, PATCH /api/v1/admin/accounts | |
| 54 | ADM-03 | 管理 | SCR-012 | GET, PUT /api/v1/admin/role-permissions | |
| 55 | ATT-01/02 | 添付 | 共通 | POST /api/v1/attachments, GET /api/v1/attachments/{id} | Presigned URL S3 |
| 56 | MST-01 | マスタ | SCR-150〜152 | GET, PUT /api/v1/masters/{type} | calendar/items/shippers/seri-sessions |
| 57 | NTF-01〜03 | 通知 | SCR-004, 110 | /api/v1/notifications | |
| 58 | **SYN-01** | 同期 | SCR-030, 061, 160 | POST /api/v1/sync | Phát lại hàng đợi offline (DD-09) |

## 5. API Detail

### 5.1 TRD-02 相対取引 登録・確定

| System Name | 桜水産市場 業務支援 | API Name | 相対取引 登録・確定 | Created | 2026-11-15 |
|---|---|---|---|---|---|
| Endpoint | /api/v1/trades/aitai | Method | POST | Media type | application/json |
| Description | Tạo và xác nhận 1 giao dịch 相対 trong 1 transaction. Bị từ chối → không có bản ghi nào. Permission `trade.write`. Hàm DB `fn_aitai_create_confirm` (DD-02) | | | | |

**Request Params**

| No | Param Type | Key | Data Type | Values | Description |
|---|---|---|---|---|---|
| 1 | Header | Idempotency-Key | uuid | | Bắt buộc |
| 2 | Body | lot_code | string | `L261115-012` | |
| 3 | Body | buyer_code | string | `N01` | |
| 4 | Body | qty | string(decimal) | `"20.0"` | > 0, 1 chữ số thập phân |
| 5 | Body | unit_price | integer | `4800` | ≥ 0 |

**Responses**

| No | Status | Description | Example |
|---|---|---|---|
| 1 | 201 | Đã xác nhận | `{"trade_code":"T261115-0144","status":"確定","business_day":"2026-11-15","amount":96000,"lot":{"lot_code":"L261115-012","available_qty":"64.5"}}` |
| 2 | 400 | Định dạng sai | `{"errors":[{"error_code":"M_03","error_extra":{"qty":"0"}}]}` |
| 3 | 409 | Vi phạm nghiệp vụ (theo thứ tự §4 Business Rules) | `{"errors":[{"error_code":"E-ELG-03","error_description":"N03（仲卸）の許可は 2026-11-14 で期限切れです。取引は作成されていません","error_extra":{"basis":"許可","valid_to":"2026-11-14"}}]}` |
| 4 | 409 | Hết hàng | `{"errors":[{"error_code":"E-LOT-02","error_extra":{"available_qty":"10.0","qty":"20.0"}}]}` |

### 5.2 PTY-07 参加資格の判定（表示用）

| Endpoint | /api/v1/parties/{code}/eligibility?day=YYYY-MM-DD | Method | GET |
|---|---|---|---|
| Description | Gọi `fn_check_eligibility` ở chế độ đọc. **Chỉ để hiển thị**; quyết định thật nằm trong TRD-02/SER-02/DEL-02 | | |

Response 200: `{"party":{"code":"N03","name":"海幸","party_type":"仲卸"},"basis":"許可","certificate_no":"K-N03-24","status":"有効","valid_to":"2026-11-14","eligible":false,"error_code":"E-ELG-03","days_left":-1}`

### 5.3 SER-02 せり結果 確認・確定

| Endpoint | /api/v1/trades/{tradeCode}/seri-approve | Method | POST | Permission | `seri.approve` |
|---|---|---|---|---|---|

Request: không body. Responses: 200 `{"trade_code":…,"status":"確定"}` · 409 `E-SOD-01` (actor = người nhập) · 409 `E-ELG-*`, `E-LOT-*` · 409 「既に確定済み」 (`status ≠ 確認待ち`).

### 5.4 DEL-02 引渡し記録

| Endpoint | /api/v1/trades/{tradeCode}/deliveries | Method | POST | Permission | `delivery.write` |
|---|---|---|---|---|---|

| No | Param Type | Key | Data Type | Description |
|---|---|---|---|---|
| 1 | Header | Idempotency-Key | uuid | |
| 2 | Body | qty | string(decimal) | ≥ 0 |
| 3 | Body | exception_type | string [optional] | 不足/超過/返却/部分キャンセル |
| 4 | Body | reason | string [optional] | Bắt buộc khi có exception_type |
| 5 | Body | device_time | datetime [optional] | Từ hàng đợi offline |
| 6 | Body | attachment_ids | int[] [optional] | |

Responses: 201 `{"seq":2,"delivered_qty":"12.0","effective_qty":"12.0","delivery_status":"完了"}` · 201 với `"delivery_status":"例外","exception_type":"資格確認"` (BR-15) · 409 `E-DEL-01`, `E-DEL-02`, 「確定済みの取引のみ」.

### 5.5 STL-02 業務日ロック

| Endpoint | /api/v1/business-days/{day}/lock | Method | POST | Permission | `settle.lock` |
|---|---|---|---|---|---|

Responses: 200 `{"day":"2026-11-15","status":"ロック済","locked_at":"2026-11-15T09:12:03+09:00","jobs":["BAT-01","BAT-02"]}` · 409 `E-STL-01` `{"unconfirmed":2,"seri_pending":1}` · 409 「既にロック済み」.

### 5.6 COR-03 修正依頼 承認（赤黒生成）

| Endpoint | /api/v1/corrections/{code}/approve | Method | POST | Permission | `correction.approve` |
|---|---|---|---|---|---|

Request: `{"comment":"string [optional]"}`. Response 200:
```json
{"correction_code":"CR-2026-00013","status":"承認",
 "trade_code":"T261112-0044",
 "entries":[{"entry_no":2,"entry_type":"赤","business_day":"2026-11-15","qty":"-30.0","amount":-144000},
            {"entry_no":3,"entry_type":"黒","business_day":"2026-11-15","qty":"28.0","amount":134400}],
 "lot":{"lot_code":"L261112-009","available_qty_delta":"2.0"},
 "incentive_delta_period":"2026-12"}
```
409: `E-SOD-01`, `E-TRD-02` (ngày **hiện tại** đã khóa), `E-LOT-02` (tăng số lượng vượt lô), trạng thái ≠ 承認待ち.

### 5.7 INC-01 入金・請求データ取込

| Endpoint | /api/v1/payment-imports | Method | POST | Media type | multipart/form-data | Permission | `payment.import` |
|---|---|---|---|---|---|---|---|

| No | Param Type | Key | Data Type | Description |
|---|---|---|---|---|
| 1 | Form | file | file | CSV UTF-8 (BOM) hoặc Shift_JIS; cột: 参加者コード, 対象期(YYYY-MM), 請求額, 入金額, 入金日 |
| 2 | Form | period | string | Kỳ được phép trong file |

Responses: 201 `{"import_id":12,"rows":182}` · 400 toàn bộ file bị từ chối: `{"errors":[{"error_code":"M_14","error_extra":{"row":17,"column":"参加者コード","value":"X99"}}, …]}` (all-or-nothing, ADR-009).

### 5.8 INC-03 奨励金 計算実行

| Endpoint | /api/v1/incentive-periods/{period}/calculate | Method | POST | Permission | `incentive.run` |
|---|---|---|---|---|---|

Request: `{"confirm_missing_billing": true}` [optional] — bắt buộc true nếu có người tham gia chưa có 請求額. Response 200: `{"period":"2026-10","mode":"本計算|再計算|次期差分","rate_version":3,"due_date":"2026-11-10","rows":5,"total":77059,"deltas":[{"party":"N01","to_period":"2026-11","amount":-159}]}`. 409: `E-INC-02`, 「請求データ未取込」 (khi chưa xác nhận).

### 5.9 RAT-04 料率版 承認／差戻し

| Endpoint | /api/v1/rate-versions/{no}/decision | Method | POST | Permission | `rate.approve` |
|---|---|---|---|---|---|

Request: `{"decision":"approve|reject","comment":"…"}`. Response 200 `{"version_no":5,"status":"発効予定","fiscal_year":2026,"approved_count":4}`. 409: `E-SOD-01`, `E-RAT-01` (ngày hiệu lực đã qua), `E-RAT-02` (đủ 4 lần).

### 5.10 LOT-02 ロット受付

Request (Idempotency-Key bắt buộc): `{"shipper_code":"S01","item_code":"I03","initial_qty":"42","device_time":"…"[optional]}`. Response 201 `{"lot_code":"L261115-013","status":"受付","business_day":"2026-11-15"}`. 409 `E-TRD-01` (ngày nghỉ), `E-TRD-02` (ngày đã khóa — chỉ xảy ra với dữ liệu offline cũ).

### 5.11 SYN-01 オフライン同期

| Endpoint | /api/v1/sync | Method | POST |
|---|---|---|---|

Request: `{"device_id":"TAB-03","operations":[{"client_uuid":"…","op":"lot.create|delivery.record","device_time":"…","payload":{…}}]}` (tối đa 50, theo thứ tự). Response 200: `{"results":[{"client_uuid":"…","result":"成功","entity":"L261115-013"},{"client_uuid":"…","result":"競合","conflict":{"error_code":"E-DEL-01","server_state":{…}}}]}` — từng thao tác độc lập (1 transaction / thao tác), lỗi một thao tác không chặn thao tác sau trừ khi cùng `trade_code`.
