# ADR-011: Thông báo qua bảng outbox trong DB + worker; chỉ kênh app và mail

- **Status:** Accepted
- **Nguồn:** BR-NOTIFY-01 (app + mail, retry tối đa 3), FR-NOTIFY-01〜03 (Critical ≤ 5 phút; thất bại cuối → hàng đợi cảnh báo vận hành), SCOPE-OUT (SMS/FAX), Q-24

## Bối cảnh
Thông báo phát sinh trong các hàm nghiệp vụ (tư cách sắp hết hạn, ngoại lệ giao hàng, lỗi xuất kế toán, trễ khóa ngày). Gửi mail trực tiếp trong transaction sẽ làm chậm thao tác cao điểm, và nếu transaction rollback thì mail đã đi.

## Quyết định
1. Hàm nghiệp vụ chỉ `INSERT notifications(event, severity, recipients, payload, status='待機')` trong cùng transaction (transactional outbox).
2. Worker (BAT-04) chạy mỗi phút: gửi SES, cập nhật `attempts`, thử lại 3 lần (1, 2, 5 phút). Hết lượt → `最終失敗` + CloudWatch alarm → SCR-111.
3. Critical (Q-24: lỗi xuất, trễ khóa, thông báo thất bại cuối, sự kiện bảo mật) gửi ngay ở lần chạy kế tiếp → ≤ 2 phút.
4. Thông báo trong app đọc cùng bảng (`channel='app'`).

## Phương án đã bỏ
- **Gửi đồng bộ trong API:** rủi ro như trên.
- **Hàng đợi ngoài (SQS):** thêm thành phần; outbox trong DB đủ cho vài trăm thông báo/ngày.

## Hệ quả
- (+) Không mất/không gửi nhầm; đo được độ trễ.
- (−) Độ trễ tối đa ~1 phút do lịch worker — trong giới hạn 5 phút.
