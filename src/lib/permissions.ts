// 権限とロールの定義（画面とAPIで共通）
export const PERMISSIONS = {
  'lot.write': 'ロット受付登録',
  'lot.judge': '目利き・下見結果の記録',
  'trade.write': '相対取引の入力・確定・取消',
  'seri.write': 'せり結果の入力',
  'seri.approve': 'せり結果の確認・確定',
  'delivery.write': '引渡しの記録',
  'settle.lock': '業務日の締め（ロック）',
  'correction.request': '修正依頼の起票',
  'correction.approve': '修正依頼の承認・却下',
  'incentive.run': '完納奨励金の計算',
  'payment.write': '入金情報の登録',
  'party.write': '参加者・参加資格の登録',
  'rate.draft': '料率版の起票・ロールバック',
  'rate.approve': '料率版の承認',
  'audit.read': '監査ログの閲覧',
  'report.export': '帳票のCSV出力',
  'admin.users': 'アカウント管理',
  'admin.roles': 'ロール・権限設定',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLES = {
  'ROLE-INTAKE': '受付担当',
  'ROLE-JUDGE': '評価担当',
  'ROLE-TRADE': '取引担当',
  'ROLE-DELIVERY': '配送担当',
  'ROLE-SETTLEMENT': '照合事務局',
  'ROLE-APPROVER': '承認者（照合部門長）',
  'ROLE-RULE-ADMIN': 'ルール管理者',
  'ROLE-SYS-ADMIN': 'システム管理者',
} as const;

export type Role = keyof typeof ROLES;

export const isPermission = (v: string): v is Permission => v in PERMISSIONS;
export const isRole = (v: string): v is Role => v in ROLES;
