# Quick Report — Làm việc với AI (LAB-2)

> Bản nháp. **Học viên cần tự xem lại và sửa cho đúng trải nghiệm thật**, nhất là số giờ và các chỗ tự mình phát hiện.

## 1. Công cụ / skill đã dùng

- **Claude Code** (extension VS Code, model Claude Opus): sinh phần lớn code, SQL schema, seed, test, tài liệu.
- Tài liệu đi kèm Next.js 16 (`node_modules/next/dist/docs`): đọc trước khi code vì bản 16 có thay đổi phá vỡ tương thích.
- Skill của kit: `ask-expert`, `pptx` (LAB-1). Ở LAB-2 AI tự dùng bộ quy tắc: viết test trước (RED → GREEN) cho logic tính toán, `reviewer` đọc chéo.
- Kiểm tra: `tsc --noEmit`, `eslint`, `next build`, `node --test` (unit), `scripts/smoke-test-business-rules.mjs` (tích hợp với DB thật).

## 2. Chỗ AI sinh sai và cách phát hiện / sửa

| # | AI sinh sai | Phát hiện bằng cách nào | Cách sửa |
|---|---|---|---|
| 1 | Giờ trong dữ liệu seed viết `ngày + time '05:00'`, Postgres hiểu là UTC nên lệch 9 tiếng so với JST | Tự soát lại: cột là `timestamptz`, session Supabase chạy UTC | Thêm hàm `fn_jst(ngày, giờ)` rồi đổi toàn bộ |
| 2 | Luồng "tạo nháp rồi xác nhận": khi bị từ chối vẫn còn lại bản nháp, vi phạm FR-AITAI-02 ("không tạo giao dịch") | Đối chiếu với tiêu chí nghiệm thu của yêu cầu | Gộp tạo + xác nhận vào 1 hàm SQL `fn_create_trade` chạy trong 1 transaction; lỗi thì rollback cả hai |
| 3 | Theo "trí nhớ", AI định dùng `middleware.ts`, nhưng Next.js 16 đã đổi tên thành `proxy.ts` | `AGENTS.md` của Next 16 yêu cầu đọc docs đi kèm | Đọc `proxy.md`, `route.md`; dùng `proxy.ts`; `params`/`cookies()` dạng async |
| 4 | Embed quan hệ tự tham chiếu `trades → trades` trong PostgREST dễ bị hiểu nhầm chiều cha–con | Soát lại cú pháp khi viết API giao hàng | Tách thành truy vấn riêng |
| 5 | `useApi` gọi `setLoading(true)` trực tiếp trong `useEffect`, gây render lặp | ESLint (`react-hooks/set-state-in-effect`) báo lỗi | Viết lại: suy ra `loading` từ khóa request |
| 6 | Danh sách audit dùng `<>` trong `map` mà không có `key` | Soát code trước khi build | Đổi sang `<Fragment key>` |
| 7 | Kiểu dữ liệu quan hệ embed `business_days` trả về mảng nhưng code ép thành object | `tsc --noEmit` báo lỗi | Truy vấn trực tiếp bảng `business_days` |
| 8 | Supabase mặc định cho `anon` gọi được mọi hàm trong schema `public` qua RPC, nên hàm nghiệp vụ nhận `p_actor` có thể bị gọi thẳng từ trình duyệt | Rà soát bảo mật khi thiết kế | `revoke execute ... from anon, authenticated`; smoke test kiểm tra anon key bị chặn |
| 9 | `.gitignore` mẫu (`.env*`) chặn luôn `.env.example` | `git check-ignore` | Thêm `!.env.example` |
| 10 | Tài liệu ghi sai số màn hình/API (16 và 22, thực tế là 19 và 25) | Đếm lại file bằng `find` | Sửa tài liệu |
| 11 | Đăng nhập thành công nhưng vẫn đứng ở màn hình login: sau khi reset DB (tài khoản demo bị tạo lại), router phía client của Next.js dùng lại redirect cũ "/audit → /login" trong cache | Học viên thử trên trình duyệt; log server có `POST /api/auth/login 200` nhưng không có request mở trang tiếp theo | Sau đăng nhập/đăng xuất thì tải lại cả trang (`window.location.replace`) thay vì `router.replace` |

Các điểm nghiệp vụ AI **không được tự quyết** và đã ghi thành giả định (theo câu hỏi Q-06〜Q-09 của LAB-1): cách tính số tiền đủ điều kiện, thứ tự làm tròn, hạn thanh toán, nguồn dữ liệu thanh toán.

## 3. Số giờ thật đã dùng

| Tuần | Nội dung | Số giờ |
|---|---|---|
| Tuần 1 | 〔học viên tự điền〕 | 〔…h〕 |
| Tuần 2 | 〔học viên tự điền〕 | 〔…h〕 |
