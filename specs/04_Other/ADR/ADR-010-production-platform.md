# ADR-010: Nền tảng production — AWS Tokyo, Next.js trên ECS Fargate, RDS PostgreSQL, Cognito

- **Status:** Accepted
- **Nguồn:** Proposal LAB-1 slide 11 (国内クラウド・Webアプリ, マルチAZ, 別リージョン複製, IaC), NFR-AVL-01/03, NFR-SEC-01/04, DR-RET-01, APPI-01, CR-07

## Bối cảnh
Prototype LAB-2 chạy Vercel + Supabase Free (region **Mumbai**, tự tạm dừng sau 7 ngày không dùng). Đủ cho demo, nhưng: dữ liệu cá nhân người Nhật ra nước ngoài (proposal cam kết trong nước), không có SLA/Multi-AZ, không có MFA, không DR sang vùng khác.

## Quyết định
| Thành phần | Chọn | Giữ từ prototype? |
|---|---|---|
| App | Next.js 16 (App Router + Route Handlers), container trên ECS Fargate × 2 AZ sau ALB/CloudFront | Giữ code |
| DB | RDS PostgreSQL 16 Multi-AZ, PITR 7 ngày, snapshot copy sang Osaka 15 phút/lần | Giữ schema + hàm PL/pgSQL (bỏ phụ thuộc `auth.users` của Supabase) |
| Auth | Amazon Cognito (TOTP MFA, khóa tài khoản, password policy) | Thay Supabase Auth |
| File | S3 + lifecycle Glacier sau 3 năm, khôi phục ≤ 2 ngày | Mới |
| Batch | EventBridge Scheduler + ECS task | Mới |
| Mail | SES | Mới |
| IaC | Terraform; môi trường dev/stg/prod | Mới |

## Phương án đã bỏ
- **Giữ Supabase (đổi sang region Tokyo, gói Pro/Team):** nhanh nhất, nhưng DR sang vùng khác và yêu cầu kiểm toán khó cam kết bằng hợp đồng; MFA chỉ ở gói cao. Giữ làm phương án dự phòng nếu khách ưu tiên chi phí.
- **Viết lại backend bằng Java/Spring:** đội offshore quen, nhưng mất phần đã chứng minh ở prototype; không có lợi ích nghiệp vụ.

## Hệ quả
- (+) Đáp ứng RTO 4h/RPO 15 phút, dữ liệu trong Nhật Bản.
- (−) Chi phí migration code ~5 人日 (thay client Supabase bằng `pg` + Cognito SDK) — đã nằm trong インフラ構築 của LAB-1.
- Prototype giữ nguyên cho LAB-5/6 (mật khẩu demo không đổi theo yêu cầu khóa học).
