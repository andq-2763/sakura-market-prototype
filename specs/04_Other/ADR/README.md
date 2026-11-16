# Architecture Decision Records

> Thuộc `02_System Architecture / 04_Other` (spec-standard để trống thư mục `04_Other`). File **tạo mới** — spec-standard không có template ADR. Định dạng theo Michael Nygard: *Bối cảnh → Quyết định → Phương án đã bỏ → Hệ quả*. Mỗi ADR ghi rõ nguồn RFP để người review đối chiếu.

Trạng thái: `Accepted` = dùng làm nền cho LAB-5 · `Proposed` = chờ khách trả lời câu hỏi liên quan, thiết kế tạm theo quyết định này.

| ID | Quyết định | Ràng buộc đặc thù Product A | Trạng thái |
|---|---|---|---|
| [ADR-001](ADR-001-aitai-main-seri-record-only.md) | 相対 là luồng chính, せり chỉ ghi kết quả — 2 module, 2 máy trạng thái | DOM-01, 12-06, CAP-HUMAN-01 | Accepted |
| [ADR-002](ADR-002-qualification-basis-model.md) | 4 căn cứ tham gia tách riêng, kiểm tra lúc xác nhận | 02-08, BR-PERM-01, FIG-010 | Accepted |
| [ADR-003](ADR-003-business-rules-in-db-functions.md) | Quy tắc nghiệp vụ + audit cưỡng chế trong hàm DB transaction | BR-LOT-02, BR-CLOSE-01, FR-AUDIT-01 | Accepted |
| [ADR-004](ADR-004-red-black-entries-single-id.md) | 赤黒 = dòng bút toán dưới cùng `trade_code` | 06-04, FR-CORR-02, B.4 | Proposed (Q-26) |
| [ADR-005](ADR-005-business-day-0200-calendar.md) | Ngày nghiệp vụ 02:00 JST + lịch chợ | BASE-03, Q-05 | Accepted |
| [ADR-006](ADR-006-effective-dated-rate-versions.md) | Bản料率 có ngày hiệu lực, maker-checker, giới hạn 4 lần/năm | GOV-RULE-01, NFR-OPS-02 | Accepted |
| [ADR-007](ADR-007-offline-queue-scope.md) | Offline chỉ cho lô và giao hàng; xác nhận giao dịch phải online | NFR-AVL-02, 09-04, Q-20 | Accepted |
| [ADR-008](ADR-008-roles-and-approver.md) | 8 vai trò (thêm ROLE-APPROVER), 1 vai trò/tài khoản | TBL-ROLE-01, 02-08, Q-10 | Proposed (CR-05) |
| [ADR-009](ADR-009-accounting-file-interface.md) | Kế toán: CSV ra qua SFTP, CSV vào bằng upload | IF-ACC-01, Q-09, Q-13 | Accepted |
| [ADR-010](ADR-010-production-platform.md) | Production trên AWS Tokyo (Next.js + RDS PostgreSQL + Cognito) | 国内クラウド, NFR-AVL-03, NFR-SEC-01 | Accepted |
| [ADR-011](ADR-011-notification-outbox.md) | Thông báo qua outbox trong DB + worker, chỉ app + mail | BR-NOTIFY-01, FR-NOTIFY-02 | Accepted |
| [ADR-012](ADR-012-business-code-sequences.md) | Mã nghiệp vụ cấp từ bảng sequence theo ngày, có khóa | DOM-04, DQ-01 | Accepted |
