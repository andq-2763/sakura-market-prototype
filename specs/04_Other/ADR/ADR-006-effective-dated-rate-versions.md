# ADR-006: Bản料率 có ngày hiệu lực, maker-checker, tối đa 4 lần/năm, rollback không xóa

- **Status:** Accepted (đếm "năm" chờ Q-32)
- **Nguồn:** GOV-RULE-01, B.6 TBL-RATE-01, FR-INC-02, FR-RULE-01, FR-AUDIT-03, NFR-OPS-02, 06-06 ("年間最大四回の rule 変更を、履歴データの修正を要せずに")

## Bối cảnh
Tỉ lệ 奨励金, ngưỡng, hệ số thuế, số ngày hạn thanh toán thay đổi tối đa 4 lần/năm; thay đổi không được làm biến dạng kết quả đã chốt và không cần deploy. Prototype có bảng `rate_versions` với 3 trạng thái (草案/承認済/ロールバック), chưa kiểm tra 4 lần/năm, chưa có trạng thái `発効予定/有効/失効` mà SCR-100 yêu cầu (GAP-09).

## Quyết định
1. `rate_versions` lưu toàn bộ tham số: `rate_bp`, `threshold_amount`, `tax_numerator/denominator` (mặc định 110/100 — Q-06), `payment_due_days`, `effective_from`. Bản không bao giờ bị sửa sau khi `承認待ち`.
2. Máy trạng thái SM-09. Batch BAT-05 lúc 02:00 chuyển `発効予定 → 有効` và bản trước `有効 → 失効`.
3. `fn_resolve_rate(day)` = bản `有効/失効` (không `ロールバック`) có `effective_from <= day` lớn nhất. 奨励金 dùng `day = ngày cuối kỳ`. Kết quả lưu `rate_version_id` (FR-AUDIT-03).
4. Duyệt bị từ chối nếu số bản đã duyệt có `effective_from` trong cùng năm tài chính (4月〜3月) ≥ 4 (A4-07).
5. Rollback = đặt bản thành `ロールバック`; bản trước tự động có hiệu lực lại theo quy tắc 3. Kết quả 奨励金 đã chốt **không** tính lại tự động; 照合事務局 chạy lại → sinh 次期差分 (BR-09).

## Phương án đã bỏ
- **Tham số trong file cấu hình/biến môi trường:** cần deploy (trái NFR-OPS-02), không có maker-checker.
- **Rollback = xóa bản:** mất dấu vết (GOV-RULE-01 "追跡可能なロールバック").

## Hệ quả
- (+) Tính lại kỳ cũ luôn ra cùng kết quả (dùng bản có hiệu lực lúc đó).
- (−) Không hỗ trợ tỉ lệ khác nhau theo loại người tham gia/品目 — RFP không yêu cầu; nếu cần, thêm bảng con `rate_version_lines` mà không đổi API.
