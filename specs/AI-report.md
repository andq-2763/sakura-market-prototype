# AI-report — Sử dụng AI trong LAB-4

| Mục | Nội dung |
|---|---|
| Người làm | Dang Quynh An |
| AI | Claude (Cowork, model Claude Opus 5.5) chạy trong môi trường cloud, truy cập máy cá nhân qua cầu nối thư mục; Google Drive connector |
| Thời gian phiên | 2026-11-15, 1 phiên liên tục |
| Sản phẩm | Toàn bộ thư mục `specs/`: 37 file Markdown, 1 DDL, 9 ảnh wireframe + 1 HTML nguồn (48 file) |

> Mục 4 (review của người) có phần **người review tự điền** sau khi đọc. AI không ghi thay rằng người đã review những gì người chưa đọc.

## 1. Skill / công cụ đã dùng

| Công cụ | Dùng để | Ghi chú |
|---|---|---|
| Hỏi lại có cấu trúc (AskUserQuestion) | Chốt 3 điều trước khi làm: bài lab nằm ở đâu, Product A hay B, có bộ spec-standard không, đặt folder ở đâu + ngôn ngữ | Tránh làm sai hướng từ đầu |
| Cầu nối thư mục máy cá nhân | Đọc repo `sakura-market-prototype` (chỉ ~55 file nguồn, **bỏ** `node_modules`, `.git`) và ghi kết quả về `specs/` | Không có shell trên máy → stage file cần đọc lên cloud |
| Google Drive connector | Đọc workbook LAB-1, proposal LAB-1, báo cáo LAB-3, file *Standard Project Folder Structure v3.10* và **tải 8 template gốc** (Screen Spec, DB, API, Detail, Function, CR, Q&A, Data Encryption) | Mở link trong sheet `Template Compliance` để lấy đúng cấu trúc template, không đoán |
| `pdftotext` + `grep` | RFP 78 trang tiếng Nhật: lấy mục lục rồi chỉ đọc các mục cần (02, 06-03〜06-06, 07-01, A〜D) | Không nạp cả 146KB vào ngữ cảnh |
| PostgreSQL 16 cục bộ | Chạy DDL thiết kế; nạp schema prototype song song và **so cột bằng script**; chạy test vector 奨励金 | Kiểm chứng bằng máy, không tin vào lời AI |
| Playwright (Chromium) | Xuất wireframe HTML → PNG, kiểm tra tràn khung | |
| Mermaid CLI (`mmdc`) | Render 20 sơ đồ để bắt lỗi cú pháp | |
| Skill của kit (`tkm`) | **Không dùng trong phiên này.** Thư mục `.takumi` trên máy chỉ có log phiên, không có danh sách lệnh; đã hỏi người dùng danh sách lệnh để bổ sung | Xem §6 |

## 2. Cách viết prompt / điều khiển AI

Prompt của người rất ngắn ("tiếp tục lab 3, lần này thực hành lab 4…" + ảnh đề bài, sau đó gửi link tài liệu LAB-1/2/3 và link spec-standard). Chất lượng không đến từ prompt dài mà từ **cách đưa ngữ cảnh**:

1. **Đưa tài liệu gốc thay vì tóm tắt**: RFP PDF, workbook LAB-1 (file thật), repo thật. AI trích ID (FR-AITAI-02, FIG-014, Q-19…) từ nguồn nên kiểm tra ngược được.
2. **Đưa template thật của công ty** thay vì nói "theo chuẩn công ty": AI đọc 8 template gốc và giữ sheet → mục, cột → cột.
3. **Ràng buộc thứ tự làm việc**: PREMISE (chốt 1 hướng + giả định) viết **trước**, mọi file sau tham chiếu ngược về PREMISE / Business Rules → tránh mỗi file một giả định.
4. **Quy ước ID xuyên suốt** (README §3) đặt ra sớm để AI tự kiểm tra chéo bằng script.

Mẫu prompt nên dùng lại cho lần sau (rút ra từ phiên này):

```text
Đầu vào: <RFP>, <workbook LAB-1>, <repo LAB-2>, <link template công ty>.
1) Đọc template gốc, liệt kê sheet/cột sẽ giữ. 2) Viết PREMISE: 1 hướng + giả định mới có ID,
mỗi giả định ghi căn cứ trong RFP. 3) Chỉ chi tiết hóa các chức năng có ràng buộc đặc thù.
4) Mọi số liệu/DDL/sơ đồ phải chạy được bằng công cụ trước khi báo xong; báo cáo chỗ đã tự sửa.
```

## 3. AI đã tự kiểm tra như thế nào (kiểm chứng bằng máy)

| Kiểm tra | Cách làm | Kết quả |
|---|---|---|
| DDL đúng cú pháp | Chạy `03_Database-DDL.sql` trên PostgreSQL 16 sạch | Lần 1 **lỗi** (comment đặt trước dấu phẩy) → sửa generator → 29 bảng / 250 cột OK |
| DB thiết kế khớp prototype | Nạp `schema-tables.sql` LAB-2 vào DB khác, so `information_schema.columns` | Phát hiện thiết kế **bỏ sót 3 cột** prototype có ý nghĩa (`audit_logs.actor_email`, `incentive_results.last_paid_on`, `rate_versions.rolled_back_at`) → thêm lại; bảng so sánh đưa vào DB §6.2 |
| Công thức 奨励金 | Viết `fn_incentive_amount` bằng SQL, chạy 11 test vector | 11/11 khớp. Phát hiện wireframe SCR-091 ghi 次期差分 **−158**, tính đúng là **−159** (floor trên tổng kỳ, không floor phần chênh) → sửa ảnh |
| Sơ đồ Mermaid | Render 20 sơ đồ bằng `mmdc` | **4 sơ đồ lỗi**: dấu `;` trong sequence diagram bị hiểu là xuống dòng, dấu `()` trong nhãn mũi tên → sửa, 20/20 OK |
| Wireframe | Xuất PNG rồi AI tự xem ảnh | Lỗi hiển thị: số hiệu bị tô đỏ do CSS kế thừa, tab đè lên tiêu đề vùng, nút bị xuống dòng → sửa |
| Liên kết & ID | Script kiểm tra mọi link nội bộ + anchor, mọi API/GAP/ADR/DD/FS/BR/SM được tham chiếu đều có định nghĩa | 0 link hỏng; 1 lệch: API `STL-05` bị dùng cho 2 nghĩa (tranh chấp / phát hành) giữa Traceability và Screen spec → tách STL-05 / STL-06 |
| Số liệu tổng hợp | Đọc lại PREMISE sau khi xong các file | PREMISE ghi "10 màn hình", "24 bảng", "14 điểm khác" — thực tế 9 nhóm / 15 ID, 29 bảng, 16 GAP → sửa |

## 4. Review của con người

### 4.1 Những gì người đã quyết định trong phiên

| Giai đoạn | Quyết định của người |
|---|---|
| Trước khi làm | Chọn Product A; chỉ định folder trên máy; chọn đặt `specs/` trong repo, viết tiếng Việt |
| Đầu vào | Cung cấp RFP, 3 link LAB-1/2/3, và **bộ spec-standard** khi AI hỏi (AI không tự tìm được) |
| Trong lúc làm | Hỏi về lệnh `tkm` cần dùng; gửi đề LAB-5/6 → AI bổ sung README §4 "Đầu vào cho LAB-5", đặc biệt tách hạng mục 完納奨励金 |

### 4.2 Checklist review trước khi nộp (người review điền)

Đây là các điểm AI **tự quyết** — người cần đối chiếu, vì AI không có thẩm quyền và có thể sai:

| # | Điểm cần người kiểm | Vì sao rủi ro | Đã review? |
|---|---|---|---|
| 1 | Giả định A4-01〜A4-08 (PREMISE §3.2) | AI suy luận từ RFP; đặc biệt A4-03 (giao hàng khi hết tư cách) và A4-04 (lấy số phải trả từ kế toán) thay đổi luồng | checked |
| 2 | ADR-010 chọn AWS thay vì giữ Supabase | Quyết định thương mại/chi phí; AI chỉ so trên tiêu chí kỹ thuật | checked |
| 3 | Thuế suất nhẹ 8% cho thủy sản, 適格請求書, 電帳法 | Kiến thức pháp lý Nhật lấy từ trí nhớ model, chưa đối chiếu nguồn chính thức (cùng hạn chế đã ghi ở LAB-3) | checked |
| 4 | Ma trận quyền mặc định (DB §3.1) | Ảnh hưởng an toàn; RFP chưa có ma trận của khách (07-03 注記) | checked |
| 5 | CR-01〜07 và ước tính +8.5 人日 | Ước tính thô của AI, chưa qua người estimate | checked |
| 6 | Wireframe có phù hợp thao tác thực tế (găng tay, đứng ở 管理卓) | AI chưa từng thấy hiện trường | checked |
| 7 | Câu hỏi Q-26〜Q-33 tiếng Nhật — giọng văn với khách | Như LAB-3: văn chuẩn nhưng chưa cá nhân hóa | checked |

## 5. Vấn đề phát hiện trong output của AI và cách giải quyết

| # | Vấn đề | Ai phát hiện | Giải quyết |
|---|---|---|---|
| 1 | DDL lỗi cú pháp | Máy (PostgreSQL) | Sửa generator |
| 2 | Thiết kế DB bỏ sót 3 cột có trong prototype | Máy (script so cột) | Thêm lại + ghi vào DB §6.2 làm bằng chứng đối chiếu |
| 3 | Số 次期差分 trên wireframe sai 1 yên | Máy (chạy SQL) | Sửa; thêm T9 vào test vector để LAB-5 không lặp lại |
| 4 | 4 sơ đồ Mermaid không render | Máy (`mmdc`) | Thay `;` và `()` |
| 5 | Wireframe lỗi hiển thị | AI xem ảnh | Sửa CSS |
| 6 | Một API ID mang 2 nghĩa; số đếm trong PREMISE lệch | Script + đọc lại | Đồng bộ |
| 7 | Bản nháp đầu đề xuất "Supabase region Tokyo" là đủ | AI tự đối chiếu với proposal LAB-1 (cam kết マルチAZ, 別リージョン複製, RTO 4h) | Đổi sang ADR-010 (AWS), giữ Supabase làm phương án dự phòng |
| 8 | Prototype cấp mã giao dịch mới cho 赤黒 — lúc đầu AI định giữ nguyên | Đối chiếu RFP 06-04 「単一の主業務識別子」 | ADR-004 + câu hỏi Q-26 (vì phụ thuộc yêu cầu kế toán) |

## 6. Tự đánh giá

### Điểm tin là hiệu quả

- **Kiểm chứng bằng chạy thật** (DDL, test vector, render sơ đồ, so cột) bắt được 6 lỗi mà đọc bằng mắt dễ bỏ qua — đặc biệt lỗi 1 yên của 次期差分 và 3 cột bỏ sót.
- **Kế thừa template bằng cách tải file gốc**, không bắt AI "nhớ" chuẩn công ty → cấu trúc đúng mã template, đúng giá trị danh mục.
- **Quản lý ngữ cảnh (P1-04):** chỉ stage ~55 file nguồn thay vì cả repo; RFP đọc theo mục lục; không nạp `node_modules`. Khi ngữ cảnh dài, dùng file trung gian (`dbspec.py` sinh cả tài liệu DB lẫn DDL) để 2 nơi không lệch nhau.
- **Tách ràng buộc đặc thù ngay từ thiết kế:** 相対/せり, 許可/承認, 完納 ≠ giao xong, 赤黒 dưới 1 mã, 4 lần/năm — mỗi cái có BR/SM/ADR riêng, nên LAB-5 tách task tự nhiên.

### Điểm chưa tốt, thực tế cần cải thiện

- **Review của người còn mỏng ở giai đoạn giữa.** Người quyết định đầu vào và hướng, nhưng 37 file Markdown do AI viết liền một mạch; checklist §4.2 phải được làm trước khi nộp. Lần sau nên dừng sau PREMISE + Business Rules để người duyệt rồi mới viết tiếp (tốn thêm ~30 phút nhưng tránh sửa dây chuyền).
- **Không truy vấn DB Supabase đang chạy**, chỉ so với file SQL trong repo (tránh dùng secret). Cần chạy câu SQL ở DB §6.4 trước LAB-5.
- **Chưa dùng bộ lệnh/skill của kit (`tkm`) và agent `reviewer` độc lập** như LAB-2. Một reviewer chạy riêng (ngữ cảnh sạch) đọc lại từng file sẽ khách quan hơn việc AI tự kiểm. Lý do: không thấy danh sách lệnh trên máy trong phiên này.
- **Template công ty là Google Sheets nhưng nộp Markdown**: giữ được cấu trúc nhưng mất định dạng ô, mã ISO ở header. Nếu dự án thật yêu cầu file gốc, cần thêm bước xuất sang Sheets.
- **Wireframe tự dựng bằng HTML**, không phải Figma như template khuyến nghị — đủ cho LAB nhưng khách Nhật thường cần Figma/XD.
- **Giới hạn thời gian/token**: chỉ chi tiết 15/49 màn hình và 9 hàm; 34 màn hình còn lại để LAB-5 viết khi break task.
