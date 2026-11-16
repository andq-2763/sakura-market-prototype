# ADR-007: Hàng đợi offline chỉ cho ロット受付 và 引渡し記録

- **Status:** Accepted
- **Nguồn:** NFR-AVL-02, 09-04 (không yêu cầu offline toàn bộ; phải nêu rõ việc nào, dữ liệu nào, cách hòa giải), LOG-NET-01 (3〜5 lần/tuần mất mạng ngắn ở khu giao hàng), Q-20, R-12

## Bối cảnh
Khu nhận hàng và giao hàng dùng tablet, Wi-Fi chập chờn, nhân viên đeo găng. Mất dữ liệu nhập lúc cao điểm là rủi ro lớn (R-12). Ngược lại, xác nhận giao dịch cần kiểm tra tư cách + số lượng tại DB — làm offline sẽ bán vượt.

## Quyết định
1. Chỉ SCR-030 (ロット受付) và SCR-061 (引渡し記録) có chế độ offline. PWA lưu thao tác vào IndexedDB, mỗi thao tác có `client_uuid` (UUID v4) làm **Idempotency-Key**, thời gian thực hiện trên thiết bị, ID thiết bị, người dùng.
2. Giới hạn: tối đa 30 phút hoặc 50 thao tác; quá giới hạn → chặn nhập và báo "オンラインに戻ってから入力".
3. Khi có mạng: gửi lần lượt qua API SYN-01 theo thứ tự thời gian. Server ghi `sync_submissions(client_uuid UNIQUE)` → gửi lại không tạo bản ghi trùng.
4. Xung đột (ví dụ giao hàng cho giao dịch đã bị hủy, hoặc tổng giao vượt số lượng): server **không tự sửa**; thao tác vào trạng thái `競合` hiển thị ở SCR-160 cho người nhập + 照合事務局 quyết định (CAP-HUMAN-01).
5. 相対/せり xác nhận, khóa ngày, sửa, 奨励金: bắt buộc online; nút bị vô hiệu kèm biểu tượng mất mạng.
6. Ngày nghiệp vụ của thao tác offline = `fn_business_day(device_time)`; nếu ngày đó đã khóa khi đồng bộ → `競合`.

## Phương án đã bỏ
- **Offline toàn bộ (local-first DB):** vượt yêu cầu (09-04 nói rõ không cần), rủi ro bán vượt.
- **Không offline, chỉ retry:** người dùng mất dữ liệu khi đóng tab; không đáp ứng NFR-AVL-02.

## Hệ quả
- (+) Đúng phạm vi RFP, giữ an toàn số lượng.
- (−) Cần màn hình SCR-160 và test ngắt mạng thật tại chợ (UAT).
