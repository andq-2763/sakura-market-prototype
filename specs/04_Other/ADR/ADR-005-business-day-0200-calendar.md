# ADR-005: Ngày nghiệp vụ bắt đầu 02:00 JST và lịch chợ do hệ thống quản lý

- **Status:** Accepted
- **Nguồn:** BASE-03 (週6日、休市日を除く), 02-07, B.4 (業務日はJST), BR-INC-01 (JST/業務日), Q-05

## Bối cảnh
Hoạt động 02:00〜10:00, nên giao dịch lúc 01:30 thuộc ngày trước. Ngày nghiệp vụ là khóa của đối chiếu, khóa ngày, báo cáo, IF-ACC. Prototype tính đúng 02:00 (`fn_business_day`) nhưng không có lịch nghỉ (mọi ngày đều là ngày nghiệp vụ — GAP-14), và máy chủ Supabase chạy UTC (từng gây lệch 9 giờ trong seed).

## Quyết định
1. `fn_business_day(ts timestamptz) = ((ts AT TIME ZONE 'Asia/Tokyo') - interval '2 hours')::date`; mọi nơi lấy ngày nghiệp vụ gọi hàm này, không tính ở client.
2. Bảng `market_calendar(day, is_open, note)` nhập theo năm (SCR-150). Ngày `is_open=false`: chặn tạo lô/giao dịch mới (E-TRD-01), nhưng cho phép việc văn phòng (修正, 入金取込, 奨励金).
3. Mọi cột thời điểm là `timestamptz`; hiển thị luôn theo JST bất kể múi giờ trình duyệt (đội VN làm việc giờ VN).
4. Hạn thanh toán **không** dời theo ngày nghỉ (Q-08) — nếu khách trả lời khác, chỉ sửa `fn_due_date()` dùng `market_calendar`.

## Phương án đã bỏ
- **Dùng ngày dương lịch:** sai với giao dịch 00:00〜01:59.
- **Lịch nghỉ cố định theo thứ (Chủ nhật, thứ Tư):** chợ Nhật có ngày nghỉ bất thường (年末年始, 臨時休市).

## Hệ quả
- (+) Một nguồn sự thật cho ngày; test được bằng truyền `ts`.
- (−) Cần quy trình nhập lịch năm sau trước tháng 12 → đưa vào sổ tay vận hành.
