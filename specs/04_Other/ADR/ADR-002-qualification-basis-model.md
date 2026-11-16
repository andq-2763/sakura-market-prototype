# ADR-002: Bốn căn cứ tham gia tách riêng, kiểm tra tại thời điểm xác nhận

- **Status:** Accepted
- **Nguồn:** 02-02 TBL-ACTOR-01, 02-08, B.2, FIG-004, FIG-010, BR-PERM-01, FR-PARTY-01〜03, EX-TRADE-01, Q-19

## Bối cảnh
許可 (仲卸) và 承認 (売買参加者) là hai căn cứ pháp lý khác nhau, RFP cấm gộp thành một quy tắc. Ngoài ra 卸売業者 dựa trên 市場登録, 買出人 dựa trên 取引地点での登録. Hiện tại sự cố EX-TRADE-01 (tư cách hết hạn sáng ngày giao dịch) được xử lý bằng cách gọi điện và tạm dừng giao dịch.

## Quyết định
1. Bảng `party_qualifications(party_id, basis, certificate_no, valid_from, valid_to, status, …)`; CHECK ràng buộc *loại người tham gia → căn cứ* (BR-01). Một người tham gia có thể có nhiều dòng theo thời gian (gia hạn = dòng mới), không ghi đè.
2. `status` theo máy trạng thái SM-01 (申請/有効/一時停止/期限切れ/失効/再審査). Hết hạn do batch BAT-03 lúc 01:30 chuyển trạng thái, **nhưng** hàm kiểm tra vẫn so ngày (`valid_to >= business_day`) để không phụ thuộc batch.
3. Một hàm duy nhất `fn_check_eligibility(party_id, business_day)` trả `{ok, basis, status, valid_to, error_code}`; gọi trong transaction xác nhận 相対, xác nhận せり, ghi giao hàng (BR-15). Màn hình chỉ gọi API PTY-07 để **hiển thị trước** — không phải để quyết định.
4. `valid_to` = ngày hiệu lực cuối, hiệu lực đến hết ngày nghiệp vụ đó (01:59 hôm sau) — giả định Q-19.

## Phương án đã bỏ
- **Cờ `is_active` trên `parties`:** gộp 許可/承認 → vi phạm 02-08; không giữ lịch sử.
- **Kiểm tra lúc nhập nháp:** sai BR-PERM-01 ("確定時点"); tư cách có thể hết giữa lúc nhập và xác nhận.
- **Logic ở cả TypeScript và SQL (prototype LAB-2):** `party-qualification-status.ts` và `fn_qualification_problem` lặp lại cùng quy tắc → dễ lệch. Thiết kế chỉ giữ hàm SQL; TS đọc kết quả từ API.

## Hệ quả
- (+) Đáp ứng EX-TRADE-01 tự động; lịch sử tư cách truy được tại bất kỳ ngày nào (audit).
- (−) Đăng ký người tham gia mới cần 2 bước (申請 → 有効 do người khác duyệt) → thêm thao tác cho 照合事務局; chấp nhận vì 02-08 coi đây là thao tác nhạy cảm.
