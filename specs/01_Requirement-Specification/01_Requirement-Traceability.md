# Requirement Traceability Matrix — Product A 桜水産市場

> Thuộc `01_Requirement Specification` (spec-standard). File **tạo mới** (spec-standard không có template traceability; RFP 11-02 DEL-01 yêu cầu "traceability" là sản phẩm tối thiểu). Đây là bảng LAB-5 dùng để break task: mỗi dòng = 1 yêu cầu → đủ địa chỉ thiết kế để sinh task FE / API / DB / test.

| Mục | Giá trị |
|---|---|
| Version | 1.0 (2026-11-15) |
| Phạm vi | 60 yêu cầu chức năng + 16 NFR P0/P1 của RFP 07〜09 (danh sách đầy đủ 87 yêu cầu ở workbook LAB-1 sheet `1_要件・制約整理`) |
| Cột "LAB-2" | ✅ prototype làm đúng thiết kế · 🟡 làm nhưng khác thiết kế (mã `GAP-xx` ở [DB §6](../02_System-Architecture/01_High-Level-Design/03_Database-Design.md#6-đối-chiếu-với-prototype-lab-2)) · ⬜ chưa làm |

## 1. Chức năng

| Req ID | Pri | Feature | Screen | API | Bảng | Quy tắc / Thiết kế | LAB-2 |
|---|---|---|---|---|---|---|---|
| FR-IAM-01 | P0 | FT-01-01, FT-01-05 | SCR-001, SCR-012 | AUTH-01, AUTH-04, ADM-03 | accounts, role_permissions | ADR-008 | ✅ |
| NFR-SEC-01 | P0 | FT-01-02 | SCR-002 | AUTH-02 | accounts.mfa_* | ADR-010 | ⬜ |
| NFR-SEC-03 | P0 | FT-01-03 | SCR-001 | AUTH-01 | accounts.failed_count, locked_until | §5 HLD | ⬜ |
| FR-IAM-02 | P0 | FT-01-04 | SCR-010, SCR-011 | ADM-01, ADM-02 | accounts, audit_logs | BR-13 | ✅ |
| FR-PARTY-01 | P0 | FT-02-01, FT-02-02 | SCR-020, **SCR-021** | PTY-01〜PTY-05 | parties, party_qualifications | BR-01, ADR-002 | ✅ |
| FR-PARTY-02 | P0 | FT-02-04 | **SCR-040**, **SCR-052** | PTY-07, TRD-02 | party_qualifications | BR-02, DD-01 | 🟡 GAP-03 |
| FR-PARTY-03 | P1 | FT-02-05 | SCR-023 | PTY-01 `?status=expiring` | party_qualifications | SM-01, BAT-03 | ✅ |
| FIG-010 | P0 | FT-02-03 | **SCR-022** | PTY-06 | party_qualifications | SM-01 | 🟡 GAP-03 |
| FR-LOT-01 | P0 | FT-03-01, FT-15-04 | **SCR-030**, SCR-031 | LOT-01, LOT-02 | lots, code_sequences | ADR-012 | 🟡 GAP-08 |
| FR-LOT-02 | P0 | FT-03-03 | SCR-033 | LOT-04 | lots.judge_* | BR-11, SM-02 | 🟡 GAP-02 |
| FR-LOT-03 | P0 | FT-03-05 | SCR-032 | TRD-02 | lots, lot_qty_ledger | BR-03 | 🟡 GAP-05 |
| FR-LOT-04 | P1 | FT-03-07 | SCR-034 | LOT-06 | lot_qty_ledger, audit_logs | BR-06 | ⬜ |
| DQ-01 | P0 | FT-03-08 | SCR-030 | LOT-02 | lots (unique) | ADR-012 | ✅ |
| FR-AITAI-01 | P0 | FT-04-01 | **SCR-040** | TRD-02 | trades, trade_entries | SM-03, DD-02 | ✅ |
| FR-AITAI-02 | P0 | FT-04-02 | **SCR-040** | TRD-02 | — (rollback) | §4 bảng quyết định, DD-02 | ✅ |
| FR-AITAI-03 | P1 | FT-04-03 | SCR-042 | TRD-04 | trades, lot_qty_ledger | BR-05 | ✅ |
| FR-SERI-01 | P0 | FT-05-02 | **SCR-051** | SER-01 | trades (せり) | BR-11, SM-04, ADR-001 | ✅ |
| FR-SERI-02 | P0 | FT-05-03 | **SCR-052** | SER-02, SER-03 | trades | BR-12, DD-03 | 🟡 GAP-10 |
| FR-SERI-03 | P1 | FT-05-04 | SCR-042 | TRD-03 | trade_entries, audit_logs | — | ✅ |
| FR-CORR-01 | P0 | FT-08-01 | **SCR-081** | COR-02 | corrections, attachments | SM-07 | 🟡 GAP-06 (証拠はメモのみ) |
| FR-CORR-02 | P0 | FT-08-02, FT-08-03 | **SCR-082** | COR-03〜COR-05 | trade_entries | BR-06, DD-06, ADR-004 | 🟡 GAP-01 |
| FR-CORR-03 | P0 | FT-07-04 | — | (全更新API) | trigger | BR-06 | ✅ |
| FR-SETTLE-01 | P0 | FT-07-01 | **SCR-070** | STL-01 | business_days, trades, deliveries | — | ✅ |
| FR-SETTLE-02 | P0 | FT-07-03 | **SCR-072** | STL-02〜STL-04 | business_days | SM-06, DD-05 | 🟡 GAP-11 (再開なし) |
| FR-SETTLE-03 | P1 | FT-07-02 | SCR-071 | STL-05 | disputes | — | ⬜ |
| FR-INC-01 | P0 | FT-09-01, FT-09-02 | SCR-090, **SCR-091** | INC-01〜INC-03 | payment_lines, incentive_results | BR-08, DD-07 | 🟡 GAP-07 |
| FR-INC-02 | P0 | FT-10-01, FT-10-02 | **SCR-101**, **SCR-102** | RAT-02〜RAT-04 | rate_versions | BR-10, SM-09, DD-08 | 🟡 GAP-09 |
| FR-INC-03 | P0 | FT-09-03 | **SCR-091** | INC-03, INC-04 | incentive_periods, incentive_results | BR-09 | 🟡 GAP-07 |
| FR-DEL-01 | P0 | FT-06-01 | SCR-060 | DEL-01 | trades.delivery_status | SM-05 | ✅ |
| FR-DEL-02 | P0 | FT-06-03 | **SCR-061** | DEL-02 | deliveries | BR-07, DD-04 | ✅ |
| FR-DEL-03 | P1 | FT-06-04 | **SCR-061** | DEL-02, DEL-03 | deliveries, attachments | BR-07, BR-15 | 🟡 GAP-12 |
| FR-DEL-04 | P1 | FT-06-05 | SCR-062 | TRD-03 | deliveries | — | ✅ |
| FR-DEL-05 | P1 | FT-06-02 | **SCR-061** | DEL-02 | deliveries | Q-11 | ✅ |
| FR-NOTIFY-01〜03 | P1 | FT-11-01〜04 | SCR-004, SCR-110, SCR-111 | NTF-01〜NTF-03 | notifications | BR-NOTIFY-01, ADR-011 | ⬜ |
| FR-RULE-01 | P0 | FT-10-04 | SCR-100 | RAT-01 | rate_versions | SM-09 | ✅ |
| GOV-RULE-01 | P0 | FT-10-03, FT-10-05 | **SCR-102** | RAT-05 | rate_versions | BR-10, ADR-006 | 🟡 GAP-09 |
| FR-RPT-01 / TBL-REPORT-01 | P0 | FT-12-01, FT-12-05 | SCR-120 | RPT-01 | (read model) | BAT-01 | 🟡 2/12 |
| FR-RPT-02, 03 | P1 | FT-12-02〜04 | SCR-120 | RPT-01 | — | — | ⬜ |
| IF-ACC-01 | P0 | FT-13-01, 02 | SCR-130 | ACC-01, ACC-02 | acc_export_batches | ADR-009, BAT-02 | 🟡 GAP-13 |
| FR-AUDIT-01 | P0 | FT-14-01 | — | (全更新API) | audit_logs | BR-13, ADR-003 | 🟡 GAP-04 |
| FR-AUDIT-02 | P1 | FT-14-02 | SCR-140, SCR-141 | AUD-01 | audit_logs (index) | NFR-PERF-01 | ✅ |
| FR-AUDIT-03 | P1 | FT-09-04 | **SCR-091** | INC-02 | incentive_results.rate_version_id | — | ✅ |
| TBL-ATTACH-01, DR-IMAGE-01 | P0/P1 | FT-03-02, FT-15-05 | SCR-030, SCR-061, SCR-081 | ATT-01, ATT-02 | attachments | BAT-06, ADR-010 | ⬜ |
| FT-15-01 (BASE-03) | P0 | FT-15-01 | SCR-150 | MST-01 | market_calendar | BR-04 | ⬜ (GAP-14) |

## 2. Phi chức năng có tác động lên thiết kế

| NFR | Mục tiêu | Thiết kế đáp ứng | Tài liệu |
|---|---|---|---|
| NFR-AVL-01 | 99.5%/tháng trong 02:00-10:00 | Multi-AZ, deploy ngoài giờ dịch vụ | HLD §3, ADR-010 |
| NFR-AVL-02 | Tiếp tục khi mất mạng ngắn | Hàng đợi trên thiết bị cho SCR-030, SCR-061; idempotency key | ADR-007, DD-09 |
| NFR-AVL-03 | RTO ≤ 4h, RPO ≤ 15 phút | PITR + snapshot sang Osaka, IaC | ADR-010 |
| NFR-PERF-01 | p95 ≤ 2s tìm kiếm | Index theo `business_day`, `trade_code`, `party_id`, audit `(entity, entity_id)` | DB §4 |
| NFR-PERF-02 | 1,200 giao dịch/ngày cao điểm, 60 đồng thời | Khóa dòng ở mức lô, không khóa bảng | DD-02 |
| BATCH-01 | Báo cáo ngày xong trước 11:00 | BAT-01 chạy ngay sau khóa ngày | HLD §4 |
| NFR-SEC-04 | TLS, secret tách khỏi source | Secrets Manager | ADR-010, Data-Encryption-Checklist |
| NFR-OPS-02 | Đổi料率 không cần deploy | Bảng `rate_versions` + màn hình SCR-101 | ADR-006 |
| NFR-USE-01 | Thao tác bàn phím cho lô, giao dịch, giao hàng | Tab/Enter, phím tắt F-key | SCR-040 spec §5 |
| NFR-COMP-01 | Tablet, găng tay | Nút ≥ 56px, form 1 cột | SCR-030, SCR-061 |
| APPI-01 | Log truy cập dữ liệu cá nhân | `audit_logs.action='PII_READ'` cho PTY-02 | ADR-003 |
| DR-RET-01 | 7 năm online, ảnh 3 năm → cold | Partition theo năm, S3 lifecycle | DB §5 |
