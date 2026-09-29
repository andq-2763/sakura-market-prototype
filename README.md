# 桜水産市場 業務支援システム — Prototype LAB-2 (Product A)

Prototype chạy thật cho hệ thống hỗ trợ nghiệp vụ chợ đầu mối thủy sản Sakura (khách hàng Nhật hư cấu).
Giao diện tiếng Nhật. Mọi dữ liệu đều là dữ liệu giả (mock) cho mục đích đào tạo.

- **URL (Vercel):** https://sakura-market-prototype-xi.vercel.app — mở lên sẽ gặp màn hình đăng nhập trước
- **Supabase project:** https://supabase.com/dashboard/project/kusbelajyjorqzwwxyea (Region: South Asia / Mumbai)
- **Stack:** Next.js 16 (App Router, API Route Handlers, `proxy.ts`) · Supabase (Postgres + Auth) · Vercel

> ⚠️ **Lỗi kết nối DB / không đăng nhập được?** Project Supabase gói Free sẽ tự **tạm dừng (Paused)** sau khoảng 7 ngày không có truy cập.
> Vào Supabase Dashboard → chọn project → bấm **Resume project**, đợi 1–2 phút rồi tải lại trang.

## Tài khoản demo

Mật khẩu chung: **`Sakura#2026`** (dùng được đến hết LAB-6; không đổi mật khẩu các tài khoản này)

| Email | Vai trò | Dùng để xem |
|---|---|---|
| `admin@sakura-demo.example.com` | システム管理者 (có mọi quyền) | **Giảng viên review dùng tài khoản này** — xem được toàn bộ màn hình |
| `trade@sakura-demo.example.com` | 取引担当 | Nhập/xác nhận 相対取引, nhập kết quả せり |
| `approver@sakura-demo.example.com` | 承認者（照合部門長） | Xác nhận せり, duyệt yêu cầu sửa (赤黒), duyệt biểu giá |
| `settle@sakura-demo.example.com` | 照合事務局 | Đối chiếu ngày, khóa ngày nghiệp vụ, tính 完納奨励金, xuất CSV |
| `intake@sakura-demo.example.com` | 受付担当 | Tiếp nhận lô, ghi kết quả 目利き |
| `judge@sakura-demo.example.com` | 評価担当 | Ghi kết quả 目利き |
| `delivery@sakura-demo.example.com` | 配送担当 | Ghi nhận giao hàng (chia nhiều lần, ngoại lệ) |
| `rule@sakura-demo.example.com` | ルール管理者 | Lập bản nháp phiên bản biểu giá, rollback |

Kịch bản demo nhanh (khoảng 5 phút):
1. `trade` → **相対取引 入力**: chọn người mua `N03（期限切れ）` → bị từ chối kèm lý do và **không tạo giao dịch**. Chọn `N01` → xác nhận được, số lượng lô giảm.
2. `trade` → **せり結果 記録**: nhập kết quả → thử tự xác nhận → bị từ chối (tách nhiệm vụ). Đăng nhập `approver` → xác nhận được.
3. `approver` → **確定後修正**: duyệt `CR-0001` (giao dịch thuộc ngày đã khóa) → sinh bút toán đỏ + đen, bản gốc giữ nguyên.
4. `settle` → **完納奨励金**: kỳ tháng trước → **計算を実行**. K02 (trả quá hạn) và B03 (trả thiếu) = 0 yên.
5. `admin` → **監査ログ**: xem trước/sau của từng thao tác ở trên.

## Chạy local

Yêu cầu: Node.js 22.18 trở lên (dùng Node 24 cũng được).

```bash
npm install
cp .env.example .env.local      # rồi điền giá trị thật của project Supabase (xem bên dưới)
npm run db:setup                # tạo bảng + hàm + tài khoản demo + dữ liệu mock (XÓA và tạo lại dữ liệu cũ)
npm run dev                     # http://localhost:3000
```

Các biến trong `.env.local` (không commit file này):

| Biến | Lấy ở đâu (Supabase Dashboard) | Dùng ở |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL | App |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` / publishable | App (xác thực đăng nhập) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → `service_role` / secret | App (chỉ phía server, trong API route) |
| `SUPABASE_DB_URL` | Connect → Session pooler (điền mật khẩu DB) | Chỉ `npm run db:setup`; **không cần trên Vercel** |

Khi deploy Vercel: khai 3 biến đầu trong Project Settings → Environment Variables.

## Kiểm thử

```bash
npm test                 # unit test tính 完納奨励金 (ngưỡng, làm tròn xuống, quá hạn, trả thiếu, 次期差分)
npm run test:smoke       # test tích hợp gọi API thật + DB thật (cần npm run dev đang chạy và vừa chạy db:setup)
BASE_URL=https://xxx.vercel.app npm run test:smoke   # chạy với bản đã deploy
```

## Kiến trúc và bảo mật

- **Frontend** (`src/app/(app)/**`): client component, đọc/ghi hoàn toàn qua `fetch('/api/...')`, không có dữ liệu cứng trong code.
- **Backend** (`src/app/api/**/route.ts`): kiểm tra đăng nhập + quyền theo bảng `role_permissions`, rồi gọi Supabase bằng service role.
- **Quy tắc nghiệp vụ trong DB** (`supabase/schema-functions*.sql`): xác nhận giao dịch, hủy, giao hàng, khóa ngày, duyệt 赤黒 chạy trong transaction có khóa dòng (`for update`), nên chống bán vượt số lượng ngay cả khi nhiều người xác nhận cùng lúc.
- **Chặn truy cập trực tiếp**: mọi bảng bật RLS và không có policy, hàm DB bị thu hồi quyền `EXECUTE` từ `anon`/`authenticated`. Anon key lộ ra trình duyệt cũng không đọc/ghi được dữ liệu (smoke test có kiểm tra).
- **Khóa ngày nghiệp vụ**: trigger chặn UPDATE/DELETE giao dịch của ngày đã khóa. Audit log chỉ được thêm (append-only).
- **Ngày nghiệp vụ**: tính từ 02:00 JST (`fn_business_day`); 00:00–01:59 thuộc ngày hôm trước.

Danh sách màn hình bản chốt và phần mock: [docs/danh-sach-man-hinh-ban-chot.md](docs/danh-sach-man-hinh-ban-chot.md)
