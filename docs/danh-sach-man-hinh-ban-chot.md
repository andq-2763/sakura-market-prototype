# Danh sách màn hình / tính năng — bản chốt LAB-2

Product A — Hệ thống hỗ trợ nghiệp vụ chợ đầu mối thủy sản Sakura (桜水産市場).
Đầu vào: danh sách 49 màn hình, 81 feature và 22 user story của LAB-1.

Ký hiệu: **✅ Làm thật** (frontend + API route + Supabase, đọc/ghi thật) · **🟡 Làm thật nhưng đơn giản hóa / có phần mock** · **⬜ Ngoài phạm vi LAB-2**

## 1. Màn hình đã dựng

| ID LAB-1 | Màn hình | URL | Trạng thái | Ghi chú |
|---|---|---|---|---|
| SCR-001 | ログイン | `/login` | ✅ | Supabase Auth (email + mật khẩu). `proxy.ts` chặn mọi trang và API khi chưa đăng nhập |
| SCR-003 | ホーム（ダッシュボード） | `/` | ✅ | Tổng hợp theo ngày nghiệp vụ, các việc đang chờ |
| SCR-020/023 | 参加者一覧・失効間近一覧 | `/parties` | ✅ | Lọc theo loại / trạng thái tư cách (失効間近, 期限切れ, 一時停止) |
| SCR-021/022 | 参加者詳細・参加資格登録/一時停止 | `/parties/[id]` | ✅ | 許可 / 承認 / 市場登録 / 取引地点登録 là 4 căn cứ riêng; API từ chối nếu chọn sai căn cứ |
| SCR-030/031 | ロット受付登録・ロット一覧 | `/lots` | ✅ | Mã lô tự sinh theo ngày nghiệp vụ |
| SCR-032/033 | ロット詳細・目利き結果入力 | `/lots/[id]` | ✅ | Người đánh giá chọn kết quả; hệ thống chỉ ghi lại (không tự đánh giá). Nút lớn cho tablet |
| SCR-040 | 相対取引 入力・確定 | `/trades/new` | ✅ | Chỉ cần Tab/Enter. Kiểm tra tư cách + số lượng khả dụng **trong 1 transaction có khóa dòng**; bị từ chối thì không tạo giao dịch |
| SCR-041 | 取引一覧 | `/trades` | ✅ | Lọc theo ngày / loại / trạng thái |
| SCR-042/062 | 取引詳細（取消・引渡し・修正依頼・監査履歴） | `/trades/[id]` | ✅ | Gộp chi tiết giao hàng (SCR-062) và form tạo yêu cầu sửa (SCR-081) |
| SCR-051/052 | せり結果入力・確認承認 | `/seri` | ✅ | Chỉ nhập kết quả cuối do người chốt; **người nhập không được tự xác nhận** (tách nhiệm vụ, DB bắt buộc) |
| SCR-060/061 | 引渡しボード・引渡し記録 | `/deliveries`, `/trades/[id]` | ✅ | Giao nhiều lần, lũy kế / còn lại; chỉ hoàn tất khi đủ số lượng; ngoại lệ (thiếu / thừa / trả lại) bắt buộc lý do |
| SCR-070/072 | 日次照合表・業務日締め | `/settlement` | ✅ | Khóa ngày nghiệp vụ; sau khi khóa, trigger DB chặn mọi sửa/xóa trực tiếp |
| SCR-080/082 | 修正依頼一覧・審査 | `/corrections` | ✅ | Duyệt → sinh bút toán đỏ (取消) + đen (訂正) vào ngày hiện tại; bản gốc không đổi |
| SCR-091 | 奨励金計算・結果一覧 | `/incentives` | ✅ | Tính thật theo BR-INC-01; tính lại kỳ đã chốt → ghi 次期差分 |
| SCR-090 | 入金情報取込 | `/incentives` | 🟡 | **Mock**: nhập tay thay cho import CSV từ hệ thống kế toán |
| SCR-100〜102 | 料率版 一覧・起票・承認・ロールバック | `/rates` | ✅ | Người lập ≠ người duyệt; chỉ cho ngày hiệu lực trong tương lai |
| SCR-120/130 | 帳票出力・会計連携 | `/reports` | 🟡 | Làm thật 2/12 báo cáo: RPT-01 và RPT-06 (IF-ACC-01, chỉ xuất ngày đã khóa). Gửi sang hệ thống kế toán là mock |
| SCR-140/141 | 監査ログ検索・詳細 | `/audit` | ✅ | Trước/sau, người làm, thời điểm, lý do; trigger DB chặn sửa/xóa log |
| SCR-010/011 | アカウント管理 | `/admin/users` | ✅ | Đổi vai trò, dừng/mở lại; không tự khóa chính mình |
| SCR-012 | ロール・権限設定 | `/admin/roles` | ✅ | Ma trận vai trò × quyền, API phân quyền theo đúng bảng này |

**Tổng:** 19 URL màn hình + 25 API route, phủ 35/49 ID màn hình của LAB-1 (một số màn hình được gộp; 14 ID còn lại nằm ở mục 2).

## 2. Ngoài phạm vi so với LAB-1 và lý do

| ID LAB-1 | Màn hình | Lý do để ngoài | Nếu làm thật cần gì |
|---|---|---|---|
| SCR-002 | MFA認証 | Prototype ưu tiên luồng nghiệp vụ; MFA không đổi logic nghiệp vụ | Bật Supabase Auth MFA (TOTP), bắt buộc cho vai trò quản trị/duyệt |
| SCR-004, SCR-110, SCR-111 | 通知センター・通知設定・送信ログ | Gửi mail là tích hợp bên thứ ba; dashboard đã thay phần "việc đang chờ" | Dịch vụ mail (SES/Resend), hàng đợi retry 3 lần, bảng log gửi |
| SCR-034 | ロット属性調整 | Hiếm dùng; cơ chế sửa có kiểm soát đã có ở 赤黒 | Tái dùng mẫu yêu cầu sửa + audit |
| SCR-050 | せりセッション設定 | Kết quả せり đã ghi được mà không cần quản lý phiên | Bảng phiên + gán lô |
| SCR-071 | 差異・紛争管理 | Bảng đối chiếu đã đánh dấu chênh lệch; quy trình xử lý tranh chấp chưa được khách xác nhận | Bảng tranh chấp: trạng thái, người phụ trách, hạn, SLA |
| SCR-083 | 承認経路設定 | Theo giả định Q-10 là duyệt 1 cấp; người duyệt = vai trò 承認者 | Bảng luồng duyệt theo loại sửa |
| SCR-092 | 奨励金詳細 | Các cột tính toán đã hiện ngay trong danh sách kết quả | — |
| SCR-150〜152 | 市場カレンダー・品目・荷主マスタ | **Mock**: master đổ sẵn qua seed, không có màn hình sửa; lịch nghỉ chợ chưa xử lý (ngày nào cũng là ngày nghiệp vụ) | Màn hình CRUD master; bảng ngày nghỉ chợ dùng khi tính ngày nghiệp vụ và hạn thanh toán |
| SCR-160 | 同期待ち・競合解決 | Hàng đợi offline khi mất mạng ngắn là phần kỹ thuật khó nhất, không cần cho demo nghiệp vụ | PWA + IndexedDB + đồng bộ lại, màn hình xử lý xung đột |
| SCR-170 | ジョブ・運用状況 | Chưa có batch chạy định kỳ | Vercel Cron / Supabase pg_cron, bảng log job |
| RPT-02〜05, 07〜12 | 10 báo cáo còn lại | Cùng dạng query + CSV như RPT-01; ưu tiên 2 báo cáo quan trọng nhất | Mỗi báo cáo 1 query + định dạng |
| PRT-01〜04 | In phiếu PDF | Cần khuôn mẫu in chính thức của khách (Q-21) | Sinh PDF (ví dụ @react-pdf) theo mẫu |

## 3. Phần đã mock (và nếu làm thật thì cần gì)

| Phần mock | Hiện tại | Nếu làm thật |
|---|---|---|
| Dữ liệu nghiệp vụ | Dữ liệu giả do `supabase/seed-*.sql` sinh, ngày tính tương đối theo ngày chạy (tháng trước ×3 ngày + 4 ngày gần nhất) | Migration từ Excel của khách: profiling, cleansing, đối chiếu số dòng/số tiền (MIG-01〜04) |
| Import dữ liệu thanh toán | Nhập tay trên `/incentives` | Import CSV xuất từ hệ thống kế toán (Q-09), kiểm tra lỗi từng dòng |
| Gửi dữ liệu sang kế toán | Chỉ tải file CSV (UTF-8 BOM) | SFTP/API theo kết quả buổi họp interface; mã ký tự có thể cần Shift_JIS (Q-13) |
| Quy tắc tính 完納奨励金 | Giả định Q-06〜Q-08: kỳ = tháng dương lịch; hạn thanh toán = cuối kỳ + N ngày (tính cả ngày hạn); số phải trả = số tiền đủ điều kiện × 108/100; ngưỡng tính "từ … trở lên" | Chốt spec và test vector với khách; thêm lịch ngày nghỉ khi tính hạn |
| Lịch nghỉ chợ | Không xử lý | Bảng lịch; tính ngày nghiệp vụ và hạn theo lịch này |
| Bút toán đỏ/đen | Mỗi giao dịch chỉ được duyệt sửa 1 lần | Cho sửa nhiều lần: bút toán đỏ đảo bút toán đen gần nhất |
| MFA, thông báo, offline, file đính kèm | Không có (bằng chứng sửa chỉ lưu dạng ghi chú) | Như bảng mục 2; file đính kèm dùng Supabase Storage + chính sách lưu 3 năm |
| Hiệu năng, DR, giám sát | Chưa đo | Load test theo FIG-LOAD-01, sao lưu PITR, giám sát |
