# Data Encryption Checklist — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - Data Encryption Checklist` (No: BM-QT-1701-33, v1.1, Sun* spec-standard — Level of Compliance: **MUST have**). Giữ nguyên cột của sheet `Data Encryption Checklist`; chỉ liệt kê các dòng của danh mục 130 loại thông tin có xuất hiện trong hệ thống, cộng các dòng 「クライアントによって定義された機密情報」.

## History of changes

| No | Change Item | Description of changes | Change Date |
|---|---|---|---|
| 1 | All | Tạo mới cho LAB-4 từ template v1.1 | 2026-11-15 |

## Data Encryption List

| # (template) | Item / 個人情報 | Kinh tế | Tinh thần | Level (template) | Cách mã hóa template khuyến nghị | Áp dụng trong hệ thống | Biện pháp nếu không mã hóa theo khuyến nghị |
|---|---|---|---|---|---|---|---|
| 7 | Login account & password (hệ thống liên quan tài chính) | 3 | 1 | Required | Hashing | **Hashing** — mật khẩu do Cognito quản lý (SRP, không lưu ở DB ứng dụng). Mã TOTP seed do Cognito giữ | — |
| 11 | Only account number (số tài khoản ngân hàng) | 3 | 1 | Highly Recommended | Hashing | **Không lưu**. Chuyển khoản ngân hàng ngoài phạm vi (SCOPE-OUT-05, BASE-06); file thanh toán import chỉ lấy mã người tham gia + số tiền + ngày | Bước import (INC-01) bỏ cột số tài khoản nếu file kế toán có; test bằng file mẫu |
| 25, 31 | Purchase history / record (lịch sử mua của 仲卸・売買参加者・買出人) | 2 | 2 / 1 | Highly Recommended | Hashing | **Encryption at rest** (RDS AES-256, KMS) + TLS 1.2+. Không hash được vì nghiệp vụ phải đọc, tổng hợp, xuất báo cáo | RBAC theo `role_permissions`; log truy cập PII (`audit_logs.action='PII_READ'`) cho màn hình chi tiết người tham gia; không xuất CSV ra ngoài trừ RPT-06/IF-ACC-01 |
| 22, 23 | Balance / Loans (công nợ, số tiền đã trả của người tham gia) | 2 | 2 | Highly Recommended | Hashing | **Encryption at rest** (như trên) | Như trên; file import thanh toán xóa khỏi S3 tạm sau 30 ngày, giữ bản ghi đã parse |
| 120 | Amount of billing (請求に係る金額) | 1 | 1 | None | None | Encryption at rest (mặc định toàn DB) | — |
| 84, 101 | Name / Company name (tên người tham gia, tên công ty) | 1 | 1 | None | None | Encryption at rest | — |
| 90, 96 | Email / Telephone (liên hệ người tham gia, tài khoản nội bộ) | 1 | 1 | None | None | Encryption at rest; email người tham gia chỉ dùng gửi thông báo (BR-NOTIFY-01) | — |
| 94 | Employee number (mã nhân viên tài khoản nội bộ) | 1 | 1 | None | None | Encryption at rest | — |
| 110 | Photograph (ảnh chứng cứ giao hàng/tranh chấp — có thể chụp mặt người) | 1 | 1 | None | None | S3 SSE-KMS, URL ký thời hạn 5 phút, không public | Hướng dẫn chụp: chụp hàng/phiếu, tránh mặt người (TRN-01) |
| 121 | Client-defined: 許可/承認 証番号 và trạng thái tư cách | — | — | (Client) | — | Encryption at rest | Cần khách xác nhận mức bảo mật (Q-31) |
| 122 | Client-defined: 料率版 chưa có hiệu lực (thông tin nhạy cảm về giá) | — | — | (Client) | — | Encryption at rest; chỉ ROLE-RULE-ADMIN, ROLE-APPROVER đọc bản `草案/承認待ち` | — |
| 123 | Client-defined: dữ liệu migration (Excel của khách) | — | — | (Client) | — | Chỉ xử lý trong môi trường AWS của dự án, không tải về máy dev; dữ liệu UAT dùng bản che (A-06) | Checklist xóa sau cutover |

## Ghi chú kiểm tra

- Prototype LAB-2 dùng Supabase region **Mumbai** và dữ liệu giả → không áp dụng checklist này. Khi dùng dữ liệu thật (migration rehearsal 6/2027) phải ở AWS Tokyo (ADR-010).
- Secret (DB, SFTP key, SMTP) đặt trong AWS Secrets Manager, không có trong source (NFR-SEC-04). Prototype đang dùng `.env.local` — chấp nhận cho LAB.
