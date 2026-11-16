# specs/ — Bộ thiết kế LAB-4 · Product A 桜水産市場 業務支援システム

Bộ thiết kế đầy đủ (wireframe chi tiết, kiến trúc, ADR, DB, screen spec, API, detail design) phát triển từ prototype LAB-2 trong repo này. Là đầu vào trực tiếp để break task ở LAB-5.

**Đọc theo thứ tự:** [PREMISE.md](PREMISE.md) (hướng đã chốt + giả định) → [Business Rules & State Machines](01_Requirement-Specification/02_Business-Rules-and-State-Machines.md) (luật đặc thù) → [Architecture](02_System-Architecture/01_High-Level-Design/01_Architecture-Design.md) + [ADR](04_Other/ADR/README.md) → [Database](02_System-Architecture/01_High-Level-Design/03_Database-Design.md) → [Screen spec](02_System-Architecture/01_High-Level-Design/screens/00_Screen-List.md) → [API](02_System-Architecture/02_Low-Level-Design/01_API-Design.md) / [Detail Design](02_System-Architecture/02_Low-Level-Design/02_Detail-Design.md).

## 1. Cấu trúc thư mục

`specs/` tương ứng thư mục **`02_For Internal/02_Spec&Design`** trong `Standard Project Folder Structure File & Access Matrix v3.10` (sheet `My drive_FolderStructure & AccessMatrix v2.1`). Tên thư mục con giữ số thứ tự của chuẩn; ký tự `&`, khoảng trắng đổi thành `-` cho thân thiện với git.

```text
specs/
├── README.md                         ← file này (yêu cầu đề bài)
├── PREMISE.md                        ← tiền đề / giả định (yêu cầu đề bài)
├── AI-report.md                      ← báo cáo dùng AI (yêu cầu đề bài)
├── 00_CR-Management.md               ← chuẩn: 02_Spec&Design/[…] CR Management
├── 01_Requirement-Specification/     ← chuẩn: 02_Spec&Design/01_Requirement Specification
│   ├── 01_Requirement-Traceability.md
│   ├── 02_Business-Rules-and-State-Machines.md
│   └── 03_Data-Encryption-Checklist.md
├── 02_System-Architecture/           ← chuẩn: 02_Spec&Design/02_System Architecture
│   ├── 01_High-Level-Design/
│   │   ├── 01_Architecture-Design.md
│   │   ├── 03_Database-Design.md
│   │   ├── 03_Database-DDL.sql
│   │   └── screens/                  ← Screen Specification (1 file / sheet màn hình)
│   │       ├── 00_Screen-List.md     (Screen_List, Common_Message_List, Common_Spec)
│   │       └── SCR-021-022.md, SCR-030.md, SCR-040.md, SCR-051-052.md, SCR-061.md,
│   │           SCR-070-072.md, SCR-081-082.md, SCR-091.md, SCR-101-102.md
│   └── 02_Low-Level-Design/
│       ├── 01_API-Design.md
│       ├── 02_Detail-Design.md
│       └── 03_Function-Specifications.md
├── 03_Design-UIUX/                   ← chuẩn: 02_Spec&Design/03_Design (UI/UX)
│   └── wireframes/ (wireframes.html + 9 PNG)
├── 04_Other/ADR/                     ← chuẩn: 02_Spec&Design/04_Other
│   └── README.md (index) + ADR-001 … ADR-012
└── 05_QA/QA-List.md                  ← chuẩn: 02_For Internal/03_Q&A (đặt cạnh để đi cùng bộ thiết kế)
```

## 2. File nào kế thừa template công ty, file nào tạo mới

Template gốc là Google Sheets (ISO/IEC 27001 & ISO 9001, bản 22/09/2026). Vì nộp qua git, mỗi template được chuyển thành Markdown **giữ nguyên sheet → mục, cột → cột bảng, giá trị danh mục (Status, Priority…)**. Mỗi file kế thừa ghi mã template ở dòng đầu.

| File | Template spec-standard | Mã | Mức tuân thủ (sheet `Template Compliance`) | Cách kế thừa |
|---|---|---|---|---|
| `00_CR-Management.md` | CR Management | BM-QT-1701-12 v2.2 | MUST (fixed price) | Giữ 18 cột CR + giá trị Priority/Status của sheet Master |
| `01_…/03_Data-Encryption-Checklist.md` | Data Encryption Checklist | BM-QT-1701-33 v1.1 | MUST | Giữ cột của sheet chính; chỉ liệt kê các dòng (trong 130) có trong hệ thống + dòng 「クライアント定義」 |
| `02_…/03_Database-Design.md` (+ DDL) | Database Design | BM-QT-1701-28 v1.1 | Should | Sheet History / Tables List / ER Diagram / Table_name; Status theo sheet Appendix. **Thêm** §4〜§6 |
| `02_…/screens/*` | Screen Specification | BM-2-901-51 / BM-QT-1701-29 v2.2 | Should | Screen_List, Common_Message_List (giữ M_01〜M_27, thêm mã nghiệp vụ), Common_Spec, `(Template) [ID]…` (Layout / Description / View / Event). **Thêm** mục State, Permission |
| `02_…/02_Low-Level-Design/01_API-Design.md` | API Design | BM-QT-1701-30 v1.1 | Should | Common Conventions (giữ 0〜3, thêm 4〜10) / Status code / API List / API_Detail_Template |
| `02_…/02_Low-Level-Design/02_Detail-Design.md` | Detail Design (Chart + Description) | BM-QT-1701-31 v1.1 | Should | Sequence diagram + Detail function (Input/Output/Error/Detail) + Logs |
| `02_…/02_Low-Level-Design/03_Function-Specifications.md` | Function specifications | BM-QT-1701-32 v1.1 | Should | Return type / Function name / Argument / Description / Variables |
| `05_QA/QA-List.md` | Q&A List | BM-QT-1701-10 v2.2 | MUST | Cột QA一覧 (JP + VN, cấu trúc câu hỏi VN 3 phần), Status theo sheet Master |

**Tạo mới theo yêu cầu đề bài** (spec-standard không có template tương ứng):

| File | Lý do |
|---|---|
| `README.md`, `PREMISE.md`, `AI-report.md` | Đề bài yêu cầu |
| `01_…/01_Requirement-Traceability.md` | RFP 11-02 DEL-01 yêu cầu traceability; là bảng LAB-5 dùng để sinh task |
| `01_…/02_Business-Rules-and-State-Machines.md` | Đề bài yêu cầu thể hiện **điểm phân nhánh / ràng buộc đặc thù** (相対 vs せり, 許可 vs 承認, 完納 ≠ giao xong, 赤黒). Template Sun* không có chỗ đặt quy tắc dùng chung và máy trạng thái |
| `02_…/01_High-Level-Design/01_Architecture-Design.md` | Đề bài yêu cầu architecture design (thành phần, luồng dữ liệu, tích hợp). Chuẩn chỉ có thư mục `02_System Architecture`, không có template |
| `04_Other/ADR/*` | Đề bài yêu cầu ADR (bối cảnh, lựa chọn, phương án bỏ, hệ quả) — format Nygard |
| `03_Design-UIUX/wireframes/*` | Wireframe chi tiết; template Screen Spec yêu cầu ảnh từ công cụ thiết kế, không vẽ bằng sheet |

**Template của chuẩn không dùng ở LAB-4** (không thuộc phạm vi thiết kế): Effort Estimation, WBS Schedule, Test Viewpoint/Testcase (→ LAB-5/6), Release Note, các checklist quản lý dự án.

## 3. Quy ước ID dùng xuyên suốt

| Tiền tố | Nghĩa | Định nghĩa ở |
|---|---|---|
| `BASE-`, `DOM-`, `BR-*-01`, `FR-`, `NFR-`, `IF-`, `Q-01〜25` | ID của RFP / LAB-1 (giữ nguyên) | RFP, workbook LAB-1 |
| `BR-01〜16`, `SM-01〜09` | Quy tắc / máy trạng thái của thiết kế | Business Rules |
| `A4-01〜08`, `Q-26〜33`, `CR-01〜07` | Giả định / câu hỏi / thay đổi mới ở LAB-4 | PREMISE, QA-List, CR |
| `ADR-001〜012` | Quyết định kiến trúc | 04_Other/ADR |
| `SCR-`, `RPT-`, `PRT-`, `BAT-` | Màn hình / báo cáo / in / batch (theo LAB-1) | Screen List |
| `AUTH-`, `PTY-`, `LOT-`, `TRD-`, `SER-`, `DEL-`, `STL-`, `COR-`, `INC-`, `RAT-` … | API | API Design §4 |
| `DD-01〜09`, `FS-01〜12` | Detail design / function spec | Low-Level-Design |
| `GAP-01〜16` | Chỗ prototype LAB-2 làm khác thiết kế | Database Design §6.3 |
| `E-XXX-NN`, `W-`, `I-` | Mã lỗi nghiệp vụ (API 409 ↔ màn hình) | Screen List §2 |

## 4. Đầu vào cho LAB-5

| Cần cho LAB-5 | Lấy ở |
|---|---|
| Epic | 18 nhóm chức năng F01〜F18 (LAB-1) — mỗi dòng Traceability đã có Feature |
| Task build mới | Traceability: cột Screen + API + Bảng + Quy tắc của từng yêu cầu |
| Task refactor prototype | GAP-01〜GAP-16 (DB §6.3), mức Cao/TB/Thấp |
| **Hạng mục 完納奨励金 tách riêng** (yêu cầu LAB-5) | DD-07 đã chia 7 bước + 12 test vector; DD-08 料率; API INC-01〜04, RAT-01〜05; màn hình SCR-090, 091, 100〜102; bảng `payment_imports`, `payment_lines`, `incentive_periods`, `incentive_results`, `rate_versions` |
| Phụ thuộc chờ khách | Q-26〜Q-33 (QA-List) và CR-01〜07 |
| Ước lượng | Size S/M/L ở Screen List (từ LAB-1) + độ khó của DD |

## 5. Cách kiểm chứng đã làm

- DDL chạy trên PostgreSQL 16 sạch (29 bảng, 251 cột); schema prototype nạp song song và so cột bằng script (DB §6.1〜6.2).
- `fn_incentive_amount` chạy với 11 test vector (DD-07) — khớp 100%.
- Toàn bộ sơ đồ Mermaid được render bằng `mmdc` không lỗi; liên kết nội bộ giữa các file được kiểm tra bằng script.
- Wireframe render bằng Chromium (Playwright) — kiểm tra tràn khung từng màn hình.
