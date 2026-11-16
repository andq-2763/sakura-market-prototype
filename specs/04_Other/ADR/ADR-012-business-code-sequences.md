# ADR-012: Mã nghiệp vụ (lô, giao dịch, sửa, batch) cấp từ bảng sequence theo ngày có khóa dòng

- **Status:** Accepted
- **Nguồn:** DOM-04, 06-04, DQ-01 (mã bắt buộc, phát hiện trùng), FT-15-04, NFR-PERF-02 (60 người đồng thời)

## Bối cảnh
Prototype sinh mã bằng `count(*) + 1` của ngày (lô ở API route, giao dịch trong hàm DB). Hai người đăng ký cùng lúc sẽ đọc cùng `count` → trùng mã; lô đã có thông báo "同時登録によりロットコードが重複しました。もう一度登録してください" — đẩy lỗi kỹ thuật cho người dùng lúc cao điểm (GAP-08). Số lượng `count` còn lệch nếu có bản ghi bị hủy.

## Quyết định
1. Bảng `code_sequences(code_type, business_day, last_no)`; hàm `fn_next_code(code_type, day)` làm `INSERT … ON CONFLICT DO UPDATE SET last_no = last_no + 1 RETURNING last_no` (khóa dòng ngắn, trong transaction của nghiệp vụ).
2. Định dạng: lô `L{YYMMDD}-{000}`, giao dịch `T{YYMMDD}-{0000}` (4 chữ số: cao điểm 1,200/ngày), sửa `CR-{YYYY}-{00000}`, batch `ACC-{YYYYMMDD}-{00}`.
3. Mã đã cấp không tái sử dụng, kể cả khi transaction rollback (chấp nhận lỗ số — giống sequence).

## Phương án đã bỏ
- **PostgreSQL SEQUENCE toàn cục:** không reset theo ngày; mã không đọc được ngày.
- **Retry tự động khi trùng:** che lỗi, vẫn có tranh chấp khi tải cao.

## Hệ quả
- (+) Không trùng mã dưới tải đồng thời; mã nhìn là biết ngày.
- (−) Có thể lỗ số khi rollback → báo cáo không được dùng "số cuối" để đếm giao dịch (đã ghi chú cho RPT-01).
