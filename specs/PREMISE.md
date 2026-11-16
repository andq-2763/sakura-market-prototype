# PREMISE — Tiền đề cho LAB-4 (Product A — 桜水産市場)

Tài liệu này chốt **một hướng duy nhất** làm nền cho bộ thiết kế LAB-4. Mọi file trong `specs/` đều suy ra từ các quyết định dưới đây. Khi một quyết định ở đây thay đổi, phải cập nhật [00_CR-Management.md](00_CR-Management.md) và các file bị ảnh hưởng.

## 1. Đầu vào đã dùng

| Nguồn | Phiên bản | Vai trò trong LAB-4 |
|---|---|---|
| RFP `PRODUCT-A-RFP-JA-V1.0-RC7` (78 trang) | 第1.0版 2026-09-02 | Nguồn ràng buộc nghiệp vụ gốc. Khi tài liệu LAB khác mâu thuẫn với RFP, theo RFP |
| Workbook LAB-1 `桜水産市場_提案資料一式_見積・コストシート_v1.0.xlsx` | v1.0 | 87 yêu cầu, 25 câu hỏi Q-01〜Q-25, 18 nhóm chức năng / 81 feature, 49 màn hình + 12 báo cáo + 4 phiếu in + 6 batch, 22 user story |
| Proposal LAB-1 `桜水産市場_業務支援システム_提案書_v1.0.pptx` | 第1.0版 2026-10-05 | Kiến trúc đề xuất (国内クラウド, マルチAZ, 端末内キュー, RTO 4h/RPO 15分), phạm vi và option |
| Prototype LAB-2 `sakura-market-prototype` | commit hiện tại trên `main` | Code + DB thật (Next.js 16 + Supabase), 19 URL, 25 API route, 15 bảng |
| Báo cáo upsale LAB-3 | 2026-09-30 | Chỉ dùng để biết **điểm mở rộng** cần chừa trong kiến trúc (gói A/B/C) |
| Spec-standard công ty `Standard Project Folder Structure File & Access Matrix v3.10` | 09/09/2026 | Cấu trúc thư mục `02_Spec&Design` và 7 template thiết kế (xem [README.md](README.md)) |

## 2. Hướng đã chọn (chốt 1 hướng)

**Thiết kế cho phạm vi cơ bản (基本範囲) đúng như proposal LAB-1 đã nộp — 18 nhóm chức năng, 81 feature, 49 màn hình — chạy trên kiến trúc production, lấy prototype LAB-2 làm "bản chứng minh logic" chứ không phải kiến trúc đích.**

Hệ quả cụ thể:

1. **Không thêm tính năng của LAB-3 vào thiết kế.** Gói A (giao dịch từ xa + cổng 買出人), B (nhãn QR), C (dự báo) vẫn là option riêng (RFP 04-05, 06-05). Thiết kế chỉ chừa *điểm mở rộng* để không phải đập lại khi khách mua option:
   - Mọi bảng giao dịch đều có `party_id` của người mua → sau này tách dữ liệu theo người tham gia bên ngoài (gói A) chỉ cần thêm RLS theo `party_id`, không đổi mô hình.
   - `lot_code` là chuỗi in được, cố định suốt vòng đời → in QR (gói B) chỉ thêm phần in nhãn.
   - Bảng sự kiện (`audit_logs`, `trade_entries`, `deliveries`) giữ timestamp đầy đủ → đủ dữ liệu cho phân tích (gói C).
2. **Không bỏ tính năng nào của LAB-1.** 14 màn hình mà LAB-2 để ngoài phạm vi (MFA, thông báo, lịch chợ, offline…) vẫn được thiết kế ở mức danh sách màn hình + kiến trúc; spec chi tiết tập trung vào 10 màn hình cốt lõi (mục 4).
3. **Prototype không phải kiến trúc đích.** Supabase project của LAB-2 đặt ở Mumbai — trái điều kiện 国内クラウド của proposal. Production chuyển sang AWS Tokyo, giữ PostgreSQL và cách đặt quy tắc nghiệp vụ trong hàm DB (xem [ADR-010](04_Other/ADR/ADR-010-production-platform.md)).
4. **Chỗ prototype làm khác thiết kế được sửa theo thiết kế, không sửa thiết kế theo prototype.** Danh sách 16 điểm khác (GAP-01〜GAP-16) ở [Database Design §6](02_System-Architecture/01_High-Level-Design/03_Database-Design.md#6-đối-chiếu-với-prototype-lab-2) là input cho task refactor ở LAB-5.

## 3. Giả định đặt thêm

### 3.1 Giả định kế thừa từ LAB-1 (coi như đã được khách chấp nhận)

Toàn bộ cột 「回答がない場合の仮定」 của Q-01〜Q-25 được dùng làm điều kiện thiết kế. Những giả định có tác động trực tiếp lên cấu trúc:

| ID | Giả định | Ảnh hưởng thiết kế |
|---|---|---|
| Q-03 | Người tham gia bên ngoài **không đăng nhập** ở phạm vi cơ bản | Chỉ có tài khoản nội bộ; MFA bắt buộc cho vai trò quản trị/duyệt |
| Q-04 | Mỗi 品目 có 1 đơn vị bán, số lượng 1 chữ số thập phân, không quy đổi | `numeric(10,1)`, đơn vị lấy từ `items.unit` |
| Q-05 | Ngày nghiệp vụ 02:00〜01:59 hôm sau; lịch nghỉ chợ do quản trị hệ thống nhập | Hàm `fn_business_day()` + bảng `market_calendar` |
| Q-07 | 完納奨励金 = tổng tiền chưa thuế theo tháng × tỉ lệ × 110/100, làm tròn xuống **một lần** trên tổng kỳ; ngưỡng là 「以上」 | Thuật toán ở [Detail Design DD-07](02_System-Architecture/02_Low-Level-Design/02_Detail-Design.md) |
| Q-08 | Hạn thanh toán định nghĩa trong料率版, **tính cả ngày hạn**, không dời theo ngày nghỉ | So sánh `paid_on <= due_date` |
| Q-09 | Ngày thanh toán lấy từ CSV kế toán xuất ra (có sửa tay) | Màn hình SCR-090 + bảng `payment_imports` |
| Q-10 | Duyệt 1 cấp; người duyệt = 照合部門長 + 1 người thay | Vai trò `ROLE-APPROVER` (xem ADR-008) |
| Q-11 | Giao hàng chia lần không giới hạn; xác nhận bởi bộ phận giao hàng; quyết toán theo số lượng lúc xác nhận giao dịch | Bảng `deliveries` nhiều dòng / giao dịch |
| Q-13 | IF-ACC-01 = CSV UTF-8 BOM hằng ngày lên SFTP | Batch BAT-02 |
| Q-15 | Migration 13 tháng gần nhất | Không ảnh hưởng mô hình, chỉ dung lượng |
| Q-19 | 「有効期限日」 là ngày hiệu lực cuối cùng, có hiệu lực đến hết ngày nghiệp vụ đó | `valid_to >= business_day` |
| Q-20 | Offline chỉ cho ロット受付 và 引渡し記録, tối đa 30 phút; xác nhận giao dịch phải online | ADR-007 |

### 3.2 Giả định mới phát sinh ở LAB-4

Những điểm RFP nói chưa rõ, phát hiện khi đi vào thiết kế chi tiết. Tất cả đã được thêm vào [Q&A List](05_QA/QA-List.md) (Q-26〜Q-33) để hỏi khách; thiết kế chạy theo giả định dưới đây cho đến khi có trả lời.

| ID | Giả định | Lý do / căn cứ |
|---|---|---|
| A4-01 | Sửa sau xác nhận (赤黒) **không tạo giao dịch mới**, mà ghi thêm dòng bút toán vào sổ `trade_entries` dưới cùng `trade_code` | RFP 06-04: 「各取引には、単一の主業務識別子のみを持たせること」. Prototype đang sinh mã mới `T…-R1`, `T…-C1` → khác thiết kế (ADR-004) |
| A4-02 | Một giao dịch được sửa **nhiều lần**; mỗi lần sửa đảo bút toán đen gần nhất rồi ghi bút toán đen mới | Prototype giới hạn 1 lần; RFP không giới hạn |
| A4-03 | Khi ghi giao hàng mà tư cách người mua đã hết hạn/bị tạm dừng → **không chặn hàng đã bán**, nhưng giao hàng chuyển sang trạng thái 例外「資格確認」 và cần 照合事務局 xác nhận mới được hoàn tất | FIG-014 có nhánh 「権限確認 → 権限失効確認 → 解除後」; CAP-HUMAN-01 「争いのある荷受け完了確認」 |
| A4-04 | Số tiền phải trả dùng để phán định 完納 lấy từ **dữ liệu công nợ của hệ thống kế toán** (cùng file với dữ liệu thanh toán), không tự tính 108/100 trong hệ thống | Prototype đang tự tính `適格金額×108/100` → trộn thuế suất nhẹ 8% vào logic, mâu thuẫn với hệ số 110/100 của BR-INC-01 (Q-06) |
| A4-05 | 完納奨励金 áp dụng cho 仲卸・売買参加者・買出人 (người mua), không cho 卸売業者 | 卸売業者 là bên bán. Cần khách xác nhận 買出人 có thuộc diện không (Q-29) |
| A4-06 | Kỳ tính 奨励金 có **khóa kỳ**: sau khi 照合事務局 chốt kỳ, chạy lại chỉ được sinh 次期差分 | FR-INC-03; prototype phân biệt lần đầu/lần sau bằng "đã có dòng kết quả chưa" — không đủ chặt |
| A4-07 | Giới hạn "tối đa 4 lần/năm" của GOV-RULE-01 đếm theo **số版 được duyệt có ngày hiệu lực trong năm tài chính (4月〜3月)**; rollback không tính là một lần thay đổi | BASE-05 (năm tài chính bắt đầu tháng 4). Prototype chưa kiểm tra giới hạn này |
| A4-08 | Mỗi tài khoản có **1 vai trò chính** + được cấp thêm quyền "承認者代理" bằng cờ, không gán nhiều vai trò | Đơn giản hóa phân quyền, khớp 180 tài khoản nội bộ (Q-03) |

## 4. Phạm vi chi tiết hóa trong LAB-4

| Mức | Nội dung | Số lượng |
|---|---|---|
| Danh sách | Toàn bộ màn hình / báo cáo / phiếu in / batch | 49 + 12 + 4 + 6 |
| Wireframe chi tiết + Screen spec đầy đủ (field, validation, trạng thái, phân quyền, sự kiện) | Màn hình cốt lõi của luồng ロット → 取引 → 引渡し → 締め → 修正 → 奨励金 → 料率 | **9 nhóm = 15 ID màn hình** (SCR-021/022, 030, 040, 051/052, 061, 070/072, 081/082, 091, 100/101/102) |
| Detail design (luồng xử lý, sequence) | Các hàm nghiệp vụ có ràng buộc đặc thù | 9 hàm (DD-01〜DD-09) |
| Kiến trúc, ADR, DB | Toàn hệ thống | 1 HLD, 12 ADR, 29 bảng (+ DDL chạy được) |

Màn hình còn lại có ID, vai trò, thiết bị, feature trong [Screen List](02_System-Architecture/01_High-Level-Design/screens/00_Screen-List.md) và được đánh dấu "LAB-5: viết spec khi break task".

## 5. Những gì KHÔNG làm ở LAB-4

- Không viết lại code prototype. Các điểm khác thiết kế được ghi thành danh sách để LAB-5 break thành task.
- Không định giá lại. Ước tính 90.4 人月 của LAB-1 giữ nguyên; tác động của giả định mới A4-01〜A4-08 lên effort được ghi ở CR-Management để LAB-5 tính lại.
- Không thiết kế UI hoàn chỉnh (màu, font). Wireframe ở mức bố cục + thành phần + trạng thái.
