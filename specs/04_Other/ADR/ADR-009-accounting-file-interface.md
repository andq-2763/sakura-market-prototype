# ADR-009: Kế toán — xuất CSV qua SFTP (IF-ACC-01), nhập công nợ/thanh toán bằng upload CSV

- **Status:** Accepted (định dạng chờ Q-13, Q-30)
- **Nguồn:** IF-ACC-01, D.2 (bắt buộc: batch code, 業務日, 参加者コード, 総額と税額, 行ステータス 保留/確認済み/調整済み), 08-03, BASE-06, Q-09, Q-13, A-05

## Bối cảnh
Hệ thống kế toán hiện có không được thay (SCOPE-OUT). Phương thức truyền chưa chốt ("インターフェース検討会で確定"). 完納奨励金 cần ngày thanh toán, mà ngân hàng không kết nối. Prototype: RPT-06 là nút tải CSV, tự tính thuế 8% trong file; thanh toán nhập tay (GAP-07, GAP-13).

## Quyết định
1. **Ra (IF-ACC-01):** BAT-02 sinh file cho mỗi ngày đã khóa; `batch_code = ACC-YYYYMMDD-NN` (NN tăng khi gửi lại). Dòng = tổng theo (業務日, 参加者コード) từ `trade_entries` của ngày đó; `行ステータス`: `確認済み` (bút toán gốc), `調整済み` (có 赤黒 trong ngày), `保留` (giao dịch có tranh chấp mở). Thuế: **không tự tính** khi chưa có trả lời Q-06 — xuất `税額` theo hệ số cấu hình `tax_rate_for_export` (mặc định 8/100, ghi rõ trong file header). Gửi SFTP; lưu bản sao S3 + `acc_export_batches` (hash SHA-256, số dòng, tổng tiền).
2. Gửi lại: chỉ khi có duyệt (高感度操作, SCR-130), sinh batch code mới, đánh dấu batch cũ `superseded`.
3. **Vào (IF-PAY-01):** 照合事務局 tải file từ kế toán và upload ở SCR-090. Cột: 参加者コード, 対象期, 請求額, 入金額, 入金日. Kiểm tra toàn bộ file trước; có lỗi → không nhận dòng nào, hiện lỗi từng dòng. Sửa tay từng dòng sau import có lý do + audit.
4. Giao thức là "file" ở cả hai chiều; tầng `AccountingGateway` (interface) cho phép đổi sang API sau này mà không đổi bảng.

## Phương án đã bỏ
- **API realtime với kế toán:** chưa có spec phía khách, A-05 nói phần nhận là của khách.
- **Nhập tay thanh toán (như prototype):** 180+ người tham gia/tháng, sai sót cao, mất OBJ-05.

## Hệ quả
- (+) Đáp ứng D.2 tối thiểu, thay đổi phương thức ít ảnh hưởng.
- (−) Phụ thuộc người dùng upload file đúng kỳ → nhắc qua thông báo (ADR-011) ngày hạn +1.
