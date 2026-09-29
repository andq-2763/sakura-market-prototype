// 参加区分ごとの参加根拠と、現在の資格状態の判定（DB関数 fn_qualification_problem と同じ規則）
export const BASIS_BY_PARTY_TYPE: Record<string, string> = {
  卸売業者: '市場登録', 仲卸: '許可', 売買参加者: '承認', 買出人: '取引地点登録',
};

export type Qualification = { basis: string; certificate_no: string; valid_from: string; valid_to: string; suspended: boolean };

export function qualificationStatus(partyType: string, quals: Qualification[], day: string) {
  const basis = BASIS_BY_PARTY_TYPE[partyType];
  const current = quals.filter((q) => q.basis === basis && q.valid_from <= day).sort((a, b) => Number(day <= b.valid_to) - Number(day <= a.valid_to) || b.valid_from.localeCompare(a.valid_from) || b.valid_to.localeCompare(a.valid_to))[0];
  if (!current) return { basis, status: '未登録', validTo: null, tradable: false };
  const daysLeft = Math.round((Date.parse(current.valid_to) - Date.parse(day)) / 86400_000);
  const status = current.suspended ? '一時停止' : daysLeft < 0 ? '期限切れ' : daysLeft <= 30 ? '失効間近' : '有効';
  return { basis, status, validTo: current.valid_to, daysLeft, tradable: status === '有効' || status === '失効間近' };
}
