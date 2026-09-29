// 完納奨励金の計算（BR-INC-01）— DBに依存しない純粋関数
// 奨励金 = 適格金額 × 交付率 × 税係数(110/100)、JPY切捨て。支払期日（当日を含む）までに請求額を完納した場合のみ。
// 金額は整数演算で扱う（交付率はベーシスポイント）。
// 仮定（質問票 Q-06〜Q-08）: 適格金額＝期内の確定取引の税抜合計、請求額＝適格金額×108/100（軽減税率8%）、
// 期＝暦月、支払期日＝期末日＋支払日数、閾値は「以上」で対象。

export type RateVersion = {
  rateBp: number;
  thresholdAmount: number;
  taxNumerator: number;
  taxDenominator: number;
  paymentDueDays: number;
};

export type IncentiveInput = {
  period: string; // YYYY-MM
  eligibleAmount: number;
  rate: RateVersion;
  payments: { amount: number; paidOn: string }[]; // paidOn: YYYY-MM-DD
};

export type IncentiveResult = {
  billedAmount: number;
  paidByDue: number;
  dueDate: string;
  lastPaidOn: string | null;
  onTime: boolean;
  incentiveAmount: number;
};

const SALES_TAX_NUMERATOR = 108;

const pad = (n: number) => String(n).padStart(2, '0');

export function periodEnd(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${pad(m)}-${pad(last)}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nextPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
}

export const dueDateOf = (period: string, paymentDueDays: number) => addDays(periodEnd(period), paymentDueDays);

export function calculateIncentive({ period, eligibleAmount, rate, payments }: IncentiveInput): IncentiveResult {
  const billedAmount = Math.floor((eligibleAmount * SALES_TAX_NUMERATOR) / 100);
  const dueDate = dueDateOf(period, rate.paymentDueDays);
  // ISO形式の日付は文字列比較で前後関係を判定できる
  const paidByDue = payments.filter((p) => p.paidOn <= dueDate).reduce((s, p) => s + p.amount, 0);
  const lastPaidOn = payments.length ? payments.map((p) => p.paidOn).sort().at(-1)! : null;
  const onTime = eligibleAmount > 0 && paidByDue >= billedAmount;
  const qualifies = onTime && eligibleAmount >= rate.thresholdAmount;
  const incentiveAmount = qualifies
    ? Math.floor((eligibleAmount * rate.rateBp * rate.taxNumerator) / (10_000 * rate.taxDenominator))
    : 0;
  return { billedAmount, paidByDue, dueDate, lastPaidOn, onTime, incentiveAmount };
}

/** 確定済みの期を再計算して差が出た場合、元の結果は変えず次期の差分として扱う（FR-INC-03） */
export function deltaForNextPeriod(period: string, previousAmount: number, recalculatedAmount: number) {
  const amount = recalculatedAmount - previousAmount;
  return amount === 0 ? null : { period: nextPeriod(period), amount };
}
