# Q&A List — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - Q&A List` (No: BM-QT-1701-10, v2.2). Giữ cột của sheet `QA一覧` và bảng trạng thái của sheet `Master` (New / Waiting for Client / Answered / Closed / Reopen / Cancelled). Trong spec-standard file này nằm ở `02_For Internal/03_Q&A`; đặt trong `specs/05_QA/` để đi cùng bộ thiết kế (xem README).
>
> Câu hỏi tiếng Nhật là bản gửi khách; tiếng Việt theo cấu trúc template: (1) đối tượng hỏi, (2) ý hiểu hiện tại, (3) câu xác nhận.

## History of changes

| No | Change Item | Description of changes | Change Date |
|---|---|---|---|
| 1 | QA一覧 | Chuyển Q-01〜Q-25 từ workbook LAB-1 (sheet `2_質問票`) | 2026-11-15 |
| 2 | QA一覧 | Thêm Q-26〜Q-33 phát sinh khi thiết kế chi tiết LAB-4 | 2026-11-15 |

## 1. Câu hỏi kế thừa từ LAB-1 (Q-01〜Q-25)

Hạn hỏi 9/11 đã qua nên chưa có trả lời. Tất cả ở trạng thái **Waiting for Client**; thiết kế chạy theo cột 「回答がない場合の仮定」 của LAB-1 (tóm tắt ở [PREMISE §3.1](../PREMISE.md#31-giả-định-kế-thừa-từ-lab-1-coi-như-đã-được-khách-chấp-nhận)). Nội dung đầy đủ: workbook LAB-1 sheet `2_質問票`.

| No | Feature | Screen | Tóm tắt | Priority | Status | Thiết kế phụ thuộc |
|---|---|---|---|---|---|---|
| Q-01 | F04/F05 | SCR-040, 051 | 相対90/せり10 là tỉ lệ gì | High | Waiting for Client | ADR-001 |
| Q-02 | F04 | SCR-040 | 「買出人」 có gồm bán lại của 仲卸 không | High | Waiting for Client | BR-01 |
| Q-03 | F01 | — | Người ngoài có đăng nhập không | High | Waiting for Client | ADR-008, ADR-010 |
| Q-04 | F03 | SCR-030 | Đơn vị số lượng/giá | High | Waiting for Client | DB `items.unit` |
| Q-05 | F15 | SCR-150 | Ngày nghiệp vụ 02:00, ngày nghỉ | High | Waiting for Client | BR-04, ADR-005 |
| Q-06 | F09 | SCR-091 | 110/100 hay thuế nhẹ 8% | High | Waiting for Client | BR-08, `rate_versions.tax_*` |
| Q-07 | F09 | SCR-091 | Định nghĩa 適格金額, làm tròn | High | Waiting for Client | DD-07 |
| Q-08 | F09 | SCR-091 | Cách tính hạn thanh toán | High | Waiting for Client | DD-07 |
| Q-09 | F09 | SCR-090 | Nguồn dữ liệu thanh toán | High | Waiting for Client | ADR-009 |
| Q-10 | F08 | SCR-082 | Cấp duyệt | High | Waiting for Client | ADR-008 |
| Q-11 | F06 | SCR-061 | Giao hàng chia lần | Normal | Waiting for Client | DD-04 |
| Q-12 | F06 | SCR-060 | Nghĩa của 「荷受け」 | Normal | Waiting for Client | Nhãn màn hình |
| Q-13 | F13 | SCR-130 | Phương thức IF-ACC-01 | High | Waiting for Client | ADR-009 |
| Q-14 | — | — | 仕切精算・インボイス ngoài phạm vi | Normal | Waiting for Client | PREMISE §2 |
| Q-15 | F18 | — | Thời gian dữ liệu migration | High | Waiting for Client | DB §5 |
| Q-16 | F18 | — | Fixture CSV Appendix C | Normal | Waiting for Client | Test data |
| Q-17 | F16 | SCR-030, 061 | Thiết bị, Wi-Fi | Normal | Waiting for Client | ADR-007 |
| Q-18 | F02 | SCR-021 | 参加上限 có chặn giao dịch không | Normal | Waiting for Client | `party_qualifications.limit_amount` (chỉ hiển thị) |
| Q-19 | F02 | SCR-040 | 有効期限日 là ngày cuối hay ngày mất hiệu lực | Normal | Waiting for Client | BR-02 |
| Q-20 | F16 | SCR-030, 061 | Nghiệp vụ nào chạy offline | Normal | Waiting for Client | ADR-007 |
| Q-21 | F03/F04/F06/F08 | PRT-01〜04 | Mẫu phiếu in | Low | Waiting for Client | — |
| Q-22 | — | — | 電子帳簿保存法 | Normal | Waiting for Client | BR-16 |
| Q-23 | — | — | Người ký UAT | Normal | Waiting for Client | — |
| Q-24 | F11 | SCR-110 | Sự kiện Critical | Low | Waiting for Client | ADR-011 |
| Q-25 | — | — | Tăng trưởng 3〜5 năm | Low | Waiting for Client | HLD §3 |

## 2. Câu hỏi mới phát sinh ở LAB-4

| No | 疑問日 / Ask Date | 機能 / Feature | 画面 / Screen | 疑問（日本語）/ Question_JP | 優先度 | ステータス | Expected Deadline | 疑問（ベトナム語）/ Question_VN | 疑問者 | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|
| Q-26 | 2026-11-15 | F08 | SCR-082 | 確定後修正で生成する赤（取消）・黒（訂正）の記録は、元の取引番号のまま「明細の行」として管理し、新しい取引番号は付番しない方針でよろしいでしょうか。会計システム側で赤黒ごとに別の伝票番号が必要な場合はご教示ください。 | High | New | 2026-12-04（要件定義G1） | 1. Đối tượng: RFP 06-04 「単一の主業務識別子」, FR-CORR-02. 2. Ý hiểu: 赤黒 là dòng bút toán dưới cùng mã giao dịch. Prototype đang cấp mã mới `T…-R1/-C1`. 3. Xác nhận: kế toán có cần mã phiếu riêng cho từng dòng 赤/黒 không? | An | A4-01, ADR-004 |
| Q-27 | 2026-11-15 | F08 | SCR-081, 082 | 同一取引に対して確定後修正が複数回発生することはありますか。その場合、2回目の修正は直前の訂正（黒）を取り消して新しい訂正を作る理解でよいでしょうか。 | Normal | New | 2026-12-04 | 1. FR-CORR-01. 2. Ý hiểu: cho sửa nhiều lần, mỗi lần đảo bút toán đen gần nhất. 3. Có giới hạn số lần không? | An | A4-02 |
| Q-28 | 2026-11-15 | F06 | SCR-061 | 引渡し時点で買手の許可/承認が失効・一時停止になっていた場合（確定後に失効したケース）、引渡しを止めるべきでしょうか。当社案は「引渡しの記録は可能、ただし例外（資格確認）として照合事務局の確認後に完了」です。 | High | New | 2026-12-04 | 1. FIG-014 nhánh 「権限確認→権限失効確認→解除後」. 2. Ý hiểu: không chặn hàng đã bán, chuyển 例外 chờ xác nhận. 3. Có trường hợp phải dừng giao (ví dụ 一時停止 do nợ) không? | An | A4-03, BR-15 |
| Q-29 | 2026-11-15 | F09 | SCR-091 | 完納奨励金の交付対象は 仲卸・売買参加者・買出人 のいずれでしょうか。卸売業者は対象外という理解でよいでしょうか。 | High | New | 2026-12-04 | 1. DOM-05, BR-INC-01. 2. Ý hiểu: mọi người mua (trừ 卸売業者). 3. 買出人 có nhận 奨励金 không? | An | A4-05 |
| Q-30 | 2026-11-15 | F09 | SCR-090 | 完納判定に用いる「請求額（支払うべき金額）」は、会計システムの売掛データ（入金CSVと同じ出力）から取得する前提でよろしいでしょうか。本システム側で税額を再計算すると、会計システムとの差異が生じるおそれがあります。 | High | New | 2026-12-04 | 1. Q-09, Q-06. 2. Ý hiểu: lấy số phải trả từ kế toán, không tự tính 108/100. 3. File xuất có cột 請求額 theo người tham gia × kỳ không? | An | A4-04, GAP-07 |
| Q-31 | 2026-11-15 | F02 | SCR-021 | 許可証・承認証の番号や資格状態について、社外秘として扱うべき範囲（閲覧できる役割）をご指定ください。 | Low | New | 2027-02-05（基本設計G2） | 1. Data Encryption Checklist #121. 2. Ý hiểu: nội bộ đều xem được. 3. Có hạn chế theo vai trò không? | An | Encryption checklist |
| Q-32 | 2026-11-15 | F10 | SCR-101 | 「規則／料率の変更は年間最大4回」の「年」は会計年度（4月始まり）でしょうか。また、ロールバックや発効前に取り下げた版は回数に含めますか。 | Normal | New | 2026-12-04 | 1. GOV-RULE-01, B.6. 2. Ý hiểu: năm tài chính, chỉ đếm bản được duyệt và có hiệu lực; rollback không đếm. 3. Xác nhận. | An | A4-07, GAP-09 |
| Q-33 | 2026-11-15 | F03 | SCR-032, 033 | ロット状態「販売準備」と「公開」の違い（誰が・いつ切り替えるか）をご教示ください。また、目利き結果を記録した後に評価を訂正する場合、理由の記録で足りますか、承認が必要ですか。 | Normal | New | 2026-12-04 | 1. FIG-011. 2. Ý hiểu: 販売準備 = đã xếp chỗ/giá sàn bởi 受付; 公開 = mở bán bởi 取引担当. Sửa đánh giá trước khi bán chỉ cần lý do. 3. Xác nhận. | An | SM-02, GAP-02 |
