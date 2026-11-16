# ADR-004: 赤黒 là dòng bút toán dưới cùng một mã giao dịch

- **Status:** Proposed — chờ Q-26 (kế toán có cần mã phiếu riêng cho 赤/黒 không)
- **Nguồn:** 06-04 「各取引には、単一の主業務識別子のみを持たせること」, FR-CORR-01〜03, B.4, B.8, BR-CLOSE-01, FR-INC-03

## Bối cảnh
Sau khi khóa ngày, sửa sai chỉ được bằng bút toán đỏ (đảo) + đen (đúng), bản gốc giữ nguyên. Prototype LAB-2 tạo **2 giao dịch mới** với mã `T261115-001-R5` và `T261115-001-C5`, cùng nằm trong bảng `trades` → một giao dịch nghiệp vụ có 3 mã; báo cáo đếm số giao dịch phải loại `entry_kind`; giao hàng phải tìm "bản đen mới nhất" bằng `adjusts_trade_id`.

## Quyết định
1. `trades` giữ **1 dòng/giao dịch** với `trade_code` duy nhất và các giá trị gốc (không bao giờ UPDATE số lượng/giá sau khi xác nhận).
2. Bảng `trade_entries(trade_id, entry_no, entry_type ∈ {原始, 赤, 黒}, business_day, qty, unit_price, amount, correction_id)` là sổ bút toán. Lúc xác nhận ghi `entry_no=1, 原始`. Lúc duyệt sửa ghi thêm `赤` (= −bút toán hiệu lực gần nhất) và `黒` (giá trị mới) vào **ngày nghiệp vụ hiện tại**.
3. Giá trị hiệu lực của giao dịch = tổng các bút toán (`v_trade_effective`). Giao hàng, đối chiếu, IF-ACC, 奨励金 đọc từ sổ này theo `business_day` của bút toán.
4. Cho sửa nhiều lần (A4-02): lần sau đảo bút toán 黒 mới nhất.

## Phương án đã bỏ
- **Giữ cách của prototype (giao dịch mới cho 赤/黒):** vi phạm 06-04; số giao dịch trên báo cáo bị thổi phồng.
- **UPDATE trực tiếp + lưu lịch sử trong audit:** vi phạm BR-CLOSE-01 và B.4 ("既存の履歴を保持").

## Hệ quả
- (+) 1 mã/giao dịch; báo cáo theo ngày tự đúng (bút toán sửa nằm ở ngày sửa, ngày cũ không đổi).
- (−) Phải refactor prototype: bảng mới, sửa 5 API đọc (settlement, reports, deliveries, incentives, trades/[id]) → task LAB-5 (CR-01).
- Nếu Q-26 trả lời "kế toán cần số phiếu riêng" → thêm cột `entry_code` (`T…-0001-01`) trong `trade_entries`, vẫn giữ `trade_code` là mã chính.
