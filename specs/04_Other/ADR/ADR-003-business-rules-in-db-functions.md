# ADR-003: Cưỡng chế quy tắc nghiệp vụ và audit trong hàm DB (transaction + khóa dòng)

- **Status:** Accepted
- **Nguồn:** BR-LOT-02, BR-CLOSE-01, BR-DEL-03, FR-AITAI-02, FR-AUDIT-01, 06-04, 06-06 ("業務レベルの監査ロジック"), NFR-PERF-02 (60 người đồng thời)

## Bối cảnh
Quy tắc nguy hiểm nhất là bán vượt số lượng lô khi 2 取引担当 xác nhận cùng lúc, và sửa trực tiếp dữ liệu ngày đã khóa. Prototype LAB-2 đặt các quy tắc này trong hàm PL/pgSQL (`fn_confirm_trade` … `for update`) — đã chứng minh đúng bằng smoke test. Nhưng một số thao tác (đăng ký lô, ghi 目利き, đăng ký tư cách, duyệt料率, tính 奨励金) vẫn ghi từ API route rồi **gọi audit ở một lệnh riêng** → nếu lệnh audit lỗi, dữ liệu đã đổi mà không có log (GAP-04).

## Quyết định
1. **Mọi thao tác ghi nghiệp vụ** đi qua một hàm `fn_<module>_<action>(..., p_actor)`; hàm kiểm tra trạng thái, maker≠checker, ngày khóa, khóa dòng cần thiết, ghi dữ liệu, gọi `fn_audit()` — tất cả trong 1 transaction.
2. DB role của ứng dụng: `SELECT` trên bảng, `EXECUTE` trên hàm; **không** `INSERT/UPDATE/DELETE` trực tiếp. Trigger chặn UPDATE/DELETE ngày đã khóa và chặn sửa `audit_logs` vẫn giữ như lớp bảo vệ thứ hai.
3. Lỗi nghiệp vụ dùng `raise exception using errcode='P0001', message='E-XXX-NN: …'`; API chuyển thành HTTP 409 với `error_code`.
4. Tính toán thuần (ví dụ công thức 奨励金) có thể viết ở TypeScript để unit test, nhưng kết quả phải được **ghi** bằng hàm DB kiểm tra lại điều kiện kỳ.

## Phương án đã bỏ
- **Quy tắc ở tầng service TypeScript + ORM:** cần tự quản lý transaction/khóa; dễ sót khi thêm API mới; audit dễ nằm ngoài transaction.
- **Event sourcing đầy đủ:** đúng về audit nhưng quá nặng cho đội offshore và 9 tháng.

## Hệ quả
- (+) Bảo đảm toàn vẹn kể cả khi có công cụ khác ghi DB (batch, migration); audit không thể thiếu.
- (−) Logic chia giữa SQL và TS → cần quy ước test: mỗi hàm DB có test tích hợp (pgTAP hoặc script như `smoke-test-business-rules.mjs`).
- (−) Ràng buộc với PostgreSQL — chấp nhận (ADR-010 giữ PostgreSQL).
