# Screen List & Common Spec — Product A 桜水産市場

> **Kế thừa template** `[###(ProjectID)] ProjectName - Screen Specification` (No: BM-2-901-51 / BM-QT-1701-29, v2.2). File này tương ứng các sheet chung của template: `Screen_List` (§1), `Common_Message_List` (§2), `Common_Spec` (§3), `API_List` (→ chuyển sang [API Design](../../02_Low-Level-Design/01_API-Design.md) để không trùng). Mỗi màn hình chi tiết là 1 file `SCR-xxx.md` tương ứng sheet `(Template) [ID] ScreenCategory_ScreenName`.
>
> Template yêu cầu ảnh màn hình từ công cụ thiết kế (không vẽ bằng Excel). Wireframe được dựng bằng HTML ([03_Design-UIUX/wireframes/wireframes.html](../../../03_Design-UIUX/wireframes/wireframes.html)) rồi xuất PNG; số hiệu trên ảnh (A-1, B-2 …) trùng với cột ID trong bảng View.

## History of changes

| No | Version | Action | Sheet | Description | Updated Date | Updated By |
|---|---|---|---|---|---|---|
| 1 | 1.0 | Add New | All | Danh sách 49 màn hình + 22 báo cáo/in/batch từ LAB-1; spec chi tiết 15 ID (9 file) | 2026-11-15 | An (+ Claude) |
| 2 | 1.1 | Add New | SCR-090 | Thêm spec 入金・請求データ取込 (LAB-5) | 2026-11-16 | An (+ Claude) |

## 1. Screen List

Cột "LAB-2": URL tương ứng trong prototype. Cột "Spec": màn hình đã có spec chi tiết ở LAB-4, còn lại viết khi break task LAB-5.

| Screen ID | 種別 | Screen name | 機能 | 主な利用者 | 端末 | 規模 | LAB-2 | Spec |
|---|---|---|---|---|---|---|---|---|
| SCR-001 | 画面 | ログイン | F01 | 全社内ユーザー | PC/タブレット | S | /login | LAB-5 |
| SCR-002 | 画面 | MFA認証 | F01 | 管理・承認ロール | PC | S | — | LAB-5 |
| SCR-003 | 画面 | ホーム（ロール別ダッシュボード） | F01 | 全社内ユーザー | PC/タブレット | M | / | LAB-5 |
| SCR-004 | 画面 | 通知センター | F11 | 全社内ユーザー | PC/タブレット | S | — | LAB-5 |
| SCR-010 | 画面 | アカウント一覧 | F01 | ROLE-SYS-ADMIN | PC | S | /admin/users | LAB-5 |
| SCR-011 | 画面 | アカウント詳細・編集 | F01 | ROLE-SYS-ADMIN | PC | M | /admin/users | LAB-5 |
| SCR-012 | 画面 | ロール・権限設定 | F01 | ROLE-SYS-ADMIN | PC | M | /admin/roles | LAB-5 |
| SCR-020 | 画面 | 参加者一覧 | F02 | ROLE-TRADE, ROLE-SETTLEMENT | PC | S | /parties | LAB-5 |
| SCR-021 | 画面 | 参加者詳細・編集 | F02 | ROLE-SETTLEMENT | PC | L | /parties/[id] | [Spec chi tiết](SCR-021-022.md) |
| SCR-022 | 画面 | 参加資格の登録・状態変更 | F02 | ROLE-SETTLEMENT | PC | M | /parties/[id] | [Spec chi tiết](SCR-021-022.md) |
| SCR-023 | 画面 | 失効間近・失効一覧 | F02 | ROLE-SETTLEMENT, ROLE-TRADE | PC | S | /parties | LAB-5 |
| SCR-030 | 画面 | ロット受付登録 | F03 | ROLE-INTAKE | タブレット | L | /lots | [Spec chi tiết](SCR-030.md) |
| SCR-031 | 画面 | ロット一覧 | F03 | ROLE-INTAKE, ROLE-TRADE | PC/タブレット | M | /lots | LAB-5 |
| SCR-032 | 画面 | ロット詳細 | F03 | ROLE-INTAKE, ROLE-TRADE | PC/タブレット | M | /lots/[id] | LAB-5 |
| SCR-033 | 画面 | 目利き・下見結果入力 | F03 | ROLE-JUDGE | タブレット | S | /lots/[id] | LAB-5 |
| SCR-034 | 画面 | ロット属性調整 | F03 | ROLE-SETTLEMENT | PC | S | — | LAB-5 |
| SCR-040 | 画面 | 相対取引入力・確定 | F04 | ROLE-TRADE | PC | L | /trades/new | [Spec chi tiết](SCR-040.md) |
| SCR-041 | 画面 | 取引一覧 | F04 | ROLE-TRADE, ROLE-SETTLEMENT | PC | M | /trades | LAB-5 |
| SCR-042 | 画面 | 取引詳細・取消 | F04 | ROLE-TRADE | PC | M | /trades/[id] | LAB-5 |
| SCR-050 | 画面 | せりセッション設定 | F05 | ROLE-TRADE | PC | S | — | LAB-5 |
| SCR-051 | 画面 | せり結果入力 | F05 | ROLE-TRADE | PC | M | /seri | [Spec chi tiết](SCR-051-052.md) |
| SCR-052 | 画面 | せり結果確認・承認 | F05 | ROLE-TRADE（確認者） | PC | S | /seri | [Spec chi tiết](SCR-051-052.md) |
| SCR-060 | 画面 | 引渡しボード | F06 | ROLE-DELIVERY | PC/タブレット | M | /deliveries | LAB-5 |
| SCR-061 | 画面 | 引渡し記録入力 | F06 | ROLE-DELIVERY | タブレット | L | /trades/[id] | [Spec chi tiết](SCR-061.md) |
| SCR-062 | 画面 | 引渡し詳細 | F06 | ROLE-DELIVERY, ROLE-SETTLEMENT | PC/タブレット | M | /trades/[id] | LAB-5 |
| SCR-070 | 画面 | 日次照合表 | F07 | ROLE-SETTLEMENT | PC | L | /settlement | [Spec chi tiết](SCR-070-072.md) |
| SCR-071 | 画面 | 差異・紛争管理 | F07 | ROLE-SETTLEMENT | PC | M | — | LAB-5 |
| SCR-072 | 画面 | 業務日締め | F07 | ROLE-SETTLEMENT | PC | M | /settlement | [Spec chi tiết](SCR-070-072.md) |
| SCR-080 | 画面 | 修正依頼一覧 | F08 | ROLE-SETTLEMENT, 承認者 | PC | S | /corrections | LAB-5 |
| SCR-081 | 画面 | 修正依頼起票 | F08 | 権限付与済みユーザー | PC | M | /trades/[id] | [Spec chi tiết](SCR-081-082.md) |
| SCR-082 | 画面 | 修正依頼審査 | F08 | 承認者 | PC | M | /corrections | [Spec chi tiết](SCR-081-082.md) |
| SCR-083 | 画面 | 承認経路設定 | F08 | ROLE-SYS-ADMIN | PC | S | — | LAB-5 |
| SCR-090 | 画面 | 入金情報取込 | F09 | 財務部門 | PC | M | /incentives (mock) | [Spec chi tiết](SCR-090.md) (LAB-5) |
| SCR-091 | 画面 | 奨励金計算・結果一覧 | F09 | ROLE-SETTLEMENT | PC | M | /incentives | [Spec chi tiết](SCR-091.md) |
| SCR-092 | 画面 | 奨励金詳細 | F09 | ROLE-SETTLEMENT | PC | S | — | LAB-5 |
| SCR-100 | 画面 | 料率・規程版一覧 | F10 | ROLE-RULE-ADMIN | PC | S | /rates | [Spec chi tiết](SCR-101-102.md) |
| SCR-101 | 画面 | 料率版起票・編集 | F10 | ROLE-RULE-ADMIN | PC | M | /rates | [Spec chi tiết](SCR-101-102.md) |
| SCR-102 | 画面 | 料率版承認・ロールバック | F10 | 承認者 | PC | S | /rates | [Spec chi tiết](SCR-101-102.md) |
| SCR-110 | 画面 | 通知設定 | F11 | 運用管理者 | PC | S | — | LAB-5 |
| SCR-111 | 画面 | 送信ログ・運用アラートキュー | F11 | 運用管理者 | PC | S | — | LAB-5 |
| SCR-120 | 画面 | レポート出力 | F12 | ROLE-SETTLEMENT, 市場管理者 | PC | M | /reports (2/12) | LAB-5 |
| SCR-130 | 画面 | 会計連携出力・履歴 | F13 | ROLE-SETTLEMENT | PC | S | /reports | LAB-5 |
| SCR-140 | 画面 | 監査ログ検索 | F14 | 内部監査, ROLE-SYS-ADMIN | PC | M | /audit | LAB-5 |
| SCR-141 | 画面 | 監査ログ詳細 | F14 | 内部監査 | PC | S | /audit | LAB-5 |
| SCR-150 | 画面 | 市場カレンダー | F15 | ROLE-SYS-ADMIN | PC | S | — | LAB-5 |
| SCR-151 | 画面 | 品目・規格・単位マスタ | F15 | ROLE-SYS-ADMIN | PC | S | — | LAB-5 |
| SCR-152 | 画面 | 荷主・船マスタ | F15 | ROLE-INTAKE | PC | S | — | LAB-5 |
| SCR-160 | 画面 | 同期待ち・競合解決 | F16 | ROLE-INTAKE, ROLE-DELIVERY | タブレット | M | — | LAB-5 |
| SCR-170 | 画面 | ジョブ・運用状況 | F17 | ROLE-SYS-ADMIN | PC | S | — | LAB-5 |
| RPT-01 | 帳票 | 業務日ごとの日次取引集計 | F12 | 市場管理者 | PC | M | — | LAB-5 |
| RPT-02 | 帳票 | ロット履歴と取引状態ログ | F12 | ROLE-SETTLEMENT | PC | M | — | LAB-5 |
| RPT-03 | 帳票 | 失効済み・失効間近の参加者一覧 | F12 | ROLE-SETTLEMENT | PC | S | — | LAB-5 |
| RPT-04 | 帳票 | 滞留引渡しと引渡し例外 | F12 | ROLE-DELIVERY | PC | S | — | LAB-5 |
| RPT-05 | 帳票 | 日次照合表 | F12 | ROLE-SETTLEMENT | PC | M | — | LAB-5 |
| RPT-06 | 帳票 | 会計照合用出力表 | F12 | 財務部門 | PC | M | — | LAB-5 |
| RPT-07 | 帳票 | 期別の完納奨励金計算結果 | F12 | ROLE-SETTLEMENT | PC | M | — | LAB-5 |
| RPT-08 | 帳票 | ロック後調整ログ | F12 | 内部監査 | PC | S | — | LAB-5 |
| RPT-09 | 帳票 | 紛争と処理SLAの集計 | F12 | ROLE-SETTLEMENT | PC | S | — | LAB-5 |
| RPT-10 | 帳票 | 参加者別月次レポート | F12 | 市場管理者 | PC | M | — | LAB-5 |
| RPT-11 | 帳票 | 取引種別別月次レポート | F12 | 市場管理者 | PC | S | — | LAB-5 |
| RPT-12 | 帳票 | ルール変更・適用版レポート | F12 | 内部監査 | PC | S | — | LAB-5 |
| PRT-01 | 印刷 | ロット受領票 | F03 | ROLE-INTAKE | PC/タブレット | S | — | LAB-5 |
| PRT-02 | 印刷 | 相対取引票 | F04 | ROLE-TRADE | PC | S | — | LAB-5 |
| PRT-03 | 印刷 | 引渡し票 | F06 | ROLE-DELIVERY | タブレット | S | — | LAB-5 |
| PRT-04 | 印刷 | 修正依頼票 | F08 | ROLE-SETTLEMENT | PC | S | — | LAB-5 |
| BAT-01 | バッチ | 日次レポート生成 | F12 | システム | - | M | — | LAB-5 |
| BAT-02 | バッチ | 会計連携ファイル出力 | F13 | システム | - | S | — | LAB-5 |
| BAT-03 | バッチ | 失効チェック・警告 | F02 | システム | - | S | — | LAB-5 |
| BAT-04 | バッチ | 通知送信・再試行 | F11 | システム | - | S | — | LAB-5 |
| BAT-05 | バッチ | 料率版の発効切替 | F10 | システム | - | S | — | LAB-5 |
| BAT-06 | バッチ | 添付ファイルのコールド移行 | F15 | システム | - | S | — | LAB-5 |

## 2. Common Message List

Giữ M_01〜M_27 của template (thông báo validate chung) — không chép lại. Dưới đây là thông báo **nghiệp vụ** riêng của dự án; mã trùng với `error_code` API trả về (409).

| Message ID | Category | Original Message (JP) | Vietnamese | Description |
|---|---|---|---|---|
| E-TRD-01 | Error | 休市日（{day}）のため登録できません | Ngày nghỉ chợ | BR-04 |
| E-TRD-02 | Error | 業務日 {day} はロック済みです。修正依頼を起票してください | Ngày đã khóa | BR-06 |
| E-TRD-03 | Error | 引渡し記録がある取引は取消できません | Không hủy được vì đã giao | BR-05 |
| E-ELG-01 | Error | {party}（{type}）の{basis}が登録されていません | Không có căn cứ đúng loại | BR-01 |
| E-ELG-02 | Error | {party}の{basis}は「{status}」のため取引できません | Tư cách không ở trạng thái 有効 | SM-01 |
| E-ELG-03 | Error | {party}（{type}）の{basis}は {valid_to} で期限切れです。取引は作成されていません | Hết hạn | BR-02 |
| E-LOT-01 | Error | ロット {lot} は販売可能な状態ではありません（現在：{status}） | Lô chưa mở bán | SM-02 |
| E-LOT-02 | Error | 数量不足：ロット {lot} の残数量 {available} に対して {qty} は確定できません | Không đủ số lượng | BR-03 |
| E-SOD-01 | Error | 入力者・起票者本人は確認・承認できません（職務分離） | Maker ≠ checker | BR-12 |
| E-DEL-01 | Error | 累計引渡し数量 {sum} が有効数量 {target} を超えます。超過は例外として登録してください | Giao vượt | BR-07 |
| E-DEL-02 | Error | 例外には理由が必要です | Ngoại lệ thiếu lý do | BR-07 |
| E-STL-01 | Error | 未確定の取引が {n} 件あるためロックできません | Còn giao dịch chưa xác nhận | SM-06 |
| E-COR-01 | Error | 精算・引渡しに影響する修正には証拠の添付が必要です | Thiếu chứng cứ | D.4 |
| E-INC-01 | Error | {period} は確定済みです。再計算は次期差分として記録されます | Kỳ đã chốt | BR-09 |
| E-INC-02 | Error | {period} に有効な料率版がありません | Không có bản料率 | BR-10 |
| E-RAT-01 | Error | 発効日は翌業務日以降にしてください | Ngày hiệu lực quá khứ | BR-10 |
| E-RAT-02 | Error | {fy}年度の承認済み変更が上限（4回）に達しています | Quá 4 lần/năm | BR-10, A4-07 |
| W-ELG-01 | Warning | 有効期限まであと {n} 日です | Sắp hết hạn | FR-PARTY-03 |
| W-DEL-01 | Warning | 買手の{basis}が「{status}」です。例外（資格確認）として記録します | Giao khi tư cách lỗi | BR-15 |
| I-SYN-01 | Info | オフラインのため端末に保存しました（送信待ち {n} 件） | Đã lưu offline | ADR-007 |

## 3. Common Spec

| Spec ID | Category | Given | When | Then |
|---|---|---|---|---|
| CS-01 | Header | Đã đăng nhập | Mọi màn hình | Thanh trên hiện: ngày nghiệp vụ hiện tại (JST, theo `fn_business_day`), tên + vai trò, trạng thái mạng (tablet). Thời gian luôn hiển thị theo JST dù trình duyệt ở VN |
| CS-02 | Quyền | Người dùng không có permission của màn hình | Mở URL | Chuyển về ホーム + thông báo 403; menu không hiện mục không có quyền |
| CS-03 | Quyền | Có quyền xem nhưng không có quyền thao tác | Mở màn hình | Nút thao tác **ẩn** (không chỉ disable) — trừ trường hợp maker≠checker: hiển thị disable kèm lý do (để người dùng hiểu vì sao) |
| CS-04 | Lỗi nghiệp vụ | API trả 409 + `error_code` | Bất kỳ thao tác ghi | Hiện message tương ứng §2 ở vùng thông báo màn hình (không dùng alert), focus về trường liên quan, giữ nguyên dữ liệu đã nhập |
| CS-05 | Lỗi validate | API trả 400 với `error_extra` theo trường | Bất kỳ form | Viền trường lỗi + message M_xx dưới trường |
| CS-06 | Phiên | 30 phút không thao tác (NFR-SEC-03) | — | Đăng xuất, giữ bản nháp form trong bộ nhớ trang; tablet dùng chung: yêu cầu PIN khi đổi ca |
| CS-07 | Bàn phím | Màn hình PC | — | Tab theo thứ tự trực quan; Enter ở trường cuối = hành động chính; Esc = đóng modal/clear; không có thao tác nào bắt buộc chuột (NFR-USE-01) |
| CS-08 | Số | Trường số lượng/tiền | Nhập | Căn phải, phân cách hàng nghìn khi blur; số lượng 1 chữ số thập phân (Q-04); tiền là số nguyên JPY |
| CS-09 | Ngày khóa | Bản ghi thuộc ngày đã khóa | Mở chi tiết | Hiện nhãn 「ロック済」, ẩn nút sửa/hủy, hiện nút 「修正依頼を起票」 (nếu có quyền) |
| CS-10 | Audit | Mọi màn hình chi tiết | — | Tab/đường link 「変更履歴」 mở SCR-141 lọc theo đối tượng |
