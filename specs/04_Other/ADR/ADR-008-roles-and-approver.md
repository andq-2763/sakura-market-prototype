# ADR-008: 8 vai trò (thêm ROLE-APPROVER), 1 vai trò chính / tài khoản

- **Status:** Proposed — CR-05 chờ khách xác nhận cùng Q-10
- **Nguồn:** 02-03 TBL-ROLE-01 (7 vai trò), 02-04 (thao tác nhạy cảm), 02-08 (phân tách nhiệm vụ), D.4 (承認権限を持つ部署/階層), Q-10, Q-03

## Bối cảnh
RFP liệt kê 7 vai trò nhưng không có vai trò "người duyệt"; trong khi 5 loại thao tác cần người thứ hai duyệt. Q-10 giả định duyệt 1 cấp bởi 照合部門長 + 1 người thay. Prototype đã thêm `ROLE-APPROVER`.

## Quyết định
1. 8 vai trò: ROLE-INTAKE, ROLE-JUDGE, ROLE-TRADE, ROLE-DELIVERY, ROLE-SETTLEMENT, **ROLE-APPROVER**, ROLE-RULE-ADMIN, ROLE-SYS-ADMIN.
2. Quyền là danh sách `permission` gắn vai trò (`role_permissions`), sửa được trên SCR-012 (có audit). Ma trận mặc định ở [DB Design §3.1](../../02_System-Architecture/01_High-Level-Design/03_Database-Design.md#31-ma-trận-quyền-mặc-định).
3. Mỗi tài khoản 1 vai trò chính; cờ `acting_approver` cho người thay (A4-08) — có ngày hiệu lực.
4. Phân tách nhiệm vụ cưỡng chế ở **bản ghi** (maker ≠ checker trong hàm DB), không chỉ ở vai trò. Vì vậy ROLE-SYS-ADMIN có thể có mọi quyền ở môi trường LAB mà vẫn không tự duyệt được việc mình làm.
5. Production: ROLE-SYS-ADMIN **không** có quyền nghiệp vụ (chỉ admin/audit) — khác prototype (đã cấp hết cho giảng viên review).
6. ROLE-INTAKE **không** có quyền ghi 目利き (khác prototype, GAP-02) — 目利き thuộc ROLE-JUDGE (TBL-ROLE-01).

## Phương án đã bỏ
- **Nhiều vai trò/tài khoản:** linh hoạt nhưng dễ vô tình gộp maker+checker trên cùng người; khó audit.
- **Duyệt bằng "cấp bậc" (level 1/2/3):** chưa có ma trận của khách (07-03 注記), làm trước là đoán.

## Hệ quả
- Nếu khách trả lời Q-10 là duyệt nhiều cấp → thêm bảng `approval_routes` (SCR-083) mà không đổi hàm DB (hàm hỏi "actor có quyền duyệt bước này không").
