# ADR-001: 相対取引 là luồng chính, せり chỉ ghi kết quả do người chốt

- **Status:** Accepted (2026-11-15)
- **Nguồn:** DOM-01 (01-03, FIG-009, C.5), FR-SERI-01〜03, CAP-HUMAN-01, 12-06 / 13-01 (thiết kế lấy せり làm trung tâm là lý do **loại hồ sơ**), R-01 (rủi ro LAB-1)

## Bối cảnh
Chợ này là 「相対の市場」: ~90% giao dịch là thỏa thuận trực tiếp (FIG-009; mẫu ngày 2026-07-15: 636 相対 / 70 せり). せり diễn ra bằng 手やり・符丁 do người điều hành; RFP cấm tự động nhận dạng. Hai luồng khác nhau ở: người nhập, thời điểm kiểm tra tư cách, có/không bước xác nhận của người thứ hai, nhịp nhập (bàn phím liên tục vs ghi kết quả sau phiên).

## Quyết định
1. Tách 2 module `aitai` và `seri` với màn hình, API, hàm DB riêng; dùng chung bảng `trades` (cột `trade_type`) để báo cáo/đối chiếu/IF-ACC không phải UNION.
2. **相対** (SM-03): nhập + xác nhận là **1 transaction**; không lưu bản nháp ở DB. Màn hình SCR-040 tối ưu cho bàn phím (Tab/Enter, không cần chuột).
3. **せり** (SM-04): chỉ nhập *kết quả cuối* (落札者・数量・単価・時刻) ở trạng thái `確認待ち`; người khác xác nhận → lúc đó mới kiểm tra tư cách + trừ số lượng. Không có trường "giá đặt", "lượt trả giá", không có chức năng điều hành phiên.
4. Dashboard, menu, thứ tự tab đặt 相対 trước せり.

## Phương án đã bỏ
- **1 luồng chung "nhập → xác nhận" cho cả hai:** buộc 相対 qua 2 bước, chậm giờ cao điểm (OBJ-01 giảm nhập lại), và tạo bản nháp có thể sót lại khi bị từ chối (vi phạm FR-AITAI-02). Prototype LAB-2 ban đầu làm như vậy và đã phải sửa (quick-report mục 2).
- **Module đấu giá trực tuyến (bid realtime):** trái 03-07 "không ép đổi mô hình giao dịch" và CAP-HUMAN-01.
- **2 bảng `aitai_trades` / `seri_results` riêng:** đối chiếu ngày, IF-ACC, 奨励金 phải gộp 2 nguồn; mất "1 mã nghiệp vụ" chung.

## Hệ quả
- (+) Đúng tỉ trọng nghiệp vụ, đúng điểm người quyết; báo cáo RPT-11 (theo loại giao dịch) chỉ là GROUP BY.
- (−) Bảng `trades` có cột chỉ dùng cho せり (`seri_time`, `seri_session_id`); chấp nhận nullable.
- Nếu Q-01 trả lời "90/10 là theo giá trị, ngày cao điểm せり tăng" → không đổi kiến trúc, chỉ đổi phân bổ test UAT.
