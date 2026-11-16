# CR Management — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - CR Management` (No: BM-QT-1701-12, v2.2; MUST have với dự án fixed price). Giữ các cột của sheet `CR Management` và giá trị Priority/Status của sheet `Master`.
>
> Ở LAB-4 chưa có khách thật nên "CR" ở đây là **thay đổi so với baseline đã báo giá ở LAB-1** do thiết kế chi tiết phát hiện. Mỗi CR phải được khách duyệt (status `CR Approved`) trước khi đưa vào task LAB-5; trong lúc chờ, LAB-5 vẫn break task theo thiết kế nhưng gắn nhãn CR.

## History of changes

| No | Change Item | Description of changes | Change Date |
|---|---|---|---|
| 1 | CR Management | Tạo mới, ghi CR-01〜CR-07 từ thiết kế LAB-4 | 2026-11-15 |

## CR list

| ID | Priority | Requester | Channel | Change Description | Reason for change | Date of Request | Features | Screen | Impact Description | Estimated Effort | Status | Update Spec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-01 | High | 提案側 (An) | Q&A Q-26 | 赤黒 lưu thành dòng `trade_entries` dưới cùng `trade_code`, không cấp mã giao dịch mới | RFP 06-04 yêu cầu 1 mã nghiệp vụ/giao dịch. Prototype cấp mã `-R/-C` | 2026-11-15 | FT-08-03 | SCR-082, SCR-042, RPT-06 | Thêm bảng `trade_entries`; báo cáo/IF-ACC đọc từ sổ bút toán. Nằm trong baseline (FT-08-03 size L) — không tăng giá | +3 人日 (refactor prototype) | Analyzing | YES — ADR-004, DB, DD-06 |
| CR-02 | Normal | 提案側 | Q-27 | Cho sửa 1 giao dịch nhiều lần | Prototype giới hạn 1 lần, RFP không giới hạn | 2026-11-15 | FT-08-03 | SCR-082 | Logic đảo bút toán đen gần nhất | +1 人日 | Analyzing | YES — DD-06 |
| CR-03 | High | 提案側 | Q-28 | Giao hàng khi tư cách hết hạn → 例外(資格確認) | FIG-014 | 2026-11-15 | FT-06-04 | SCR-061, SCR-060 | Thêm loại ngoại lệ + bước xác nhận | +2 人日 | Analyzing | YES — BR-15, DD-04 |
| CR-04 | High | 提案側 | Q-30 | Số phải trả lấy từ kế toán thay vì tự tính 108/100 | Tránh lệch với kế toán; Q-06 chưa chốt | 2026-11-15 | FT-09-01, FT-09-02 | SCR-090, SCR-091 | Format CSV import thêm cột 請求額; phụ thuộc hệ thống kế toán (A-05) | +2 人日 | Confirming | YES — ADR-009, DD-07 |
| CR-05 | Normal | 提案側 | — | Thêm vai trò `ROLE-APPROVER` (承認者) ngoài 7 vai trò của TBL-ROLE-01 | RFP không có vai trò người duyệt riêng; Q-10 giả định 照合部門長 + 1 người thay | 2026-11-15 | FT-01-05 | SCR-012 | 8 vai trò thay vì 7; ma trận quyền | 0 (đã có ở prototype) | Confirming | YES — ADR-008 |
| CR-06 | Normal | 提案側 | Q-32 | Kiểm tra giới hạn 4 lần/năm tài chính khi duyệt料率版 | GOV-RULE-01; prototype chưa có | 2026-11-15 | FT-10-02 | SCR-102 | Thêm kiểm tra + cảnh báo | +0.5 人日 | Analyzing | YES — BR-10, DD-08 |
| CR-07 | Low | 提案側 | — | Chuyển nền tảng từ Supabase (Mumbai) sang AWS Tokyo cho production | Proposal cam kết 国内クラウド, マルチAZ, 別リージョン複製 | 2026-11-15 | F17 | — | Không đổi giá (đã nằm trong インフラ費 của LAB-1); prototype giữ nguyên cho LAB | 0 | CR Approved | YES — ADR-010 |

**Tổng tác động effort ước tính:** +8.5 人日 ≈ 0.4 人月 trên 90.4 人月 (0.5%) — trong biên độ ước tính −10%〜+20% của LAB-1, không cần báo giá lại.
