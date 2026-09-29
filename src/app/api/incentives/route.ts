// 完納奨励金: 期の計算結果の照会と計算実行（FR-INC-01, FR-INC-03）
// 初回は本計算を作成。確定済みの期を再計算した差は、元の結果を変えずに次期の差分として記録する
import { ApiError, currentUser, handle, readJson, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { calculateIncentive, deltaForNextPeriod, periodEnd } from '@/lib/incentive-calculation';
import { db } from '@/lib/supabase/service-role-client';

const PERIOD = /^\d{4}-\d{2}$/;
type Rate = { id: number; version_no: number; rate_bp: number; threshold_amount: number; tax_numerator: number; tax_denominator: number; payment_due_days: number };

export const GET = handle(async (req) => {
  await currentUser();
  const period = new URL(req.url).searchParams.get('period') ?? '';
  if (!PERIOD.test(period)) throw new ApiError(400, '対象期（YYYY-MM）を指定してください');
  const [results, payments] = await Promise.all([
    db().from('incentive_results').select('*, parties(code, name, party_type), rate_versions(version_no, effective_from, rate_bp)').eq('period', period).order('id'),
    db().from('payments').select('*, parties(code, name)').eq('period', period).order('paid_on'),
  ]);
  return { period, results: unwrap(results), payments: unwrap(payments) };
});

export const POST = handle(async (req) => {
  const user = await requirePermission('incentive.run');
  const period = requireText((await readJson<{ period?: string }>(req)).period, '対象期');
  if (!PERIOD.test(period)) throw new ApiError(400, '対象期は YYYY-MM 形式です');
  const end = periodEnd(period);

  // 期末時点で有効な承認済みの料率版（時点有効）
  const rate = unwrap(await db().from('rate_versions').select('*').eq('status', '承認済').lte('effective_from', end)
    .order('effective_from', { ascending: false }).order('version_no', { ascending: false }).limit(1).maybeSingle()) as Rate | null;
  if (!rate) throw new ApiError(409, `${period} に有効な承認済み料率版がありません`);

  const trades = unwrap(await db().from('trades').select('buyer_party_id, amount, parties!inner(party_type)')
    .eq('status', '確定').gte('business_day', `${period}-01`).lte('business_day', end).neq('parties.party_type', '卸売業者')) as { buyer_party_id: number; amount: number }[];
  const payments = unwrap(await db().from('payments').select('party_id, paid_amount, paid_on').eq('period', period)) as { party_id: number; paid_amount: number; paid_on: string }[];
  const existing = unwrap(await db().from('incentive_results').select('party_id, incentive_amount, kind, period, source_period')
    .or(`and(period.eq.${period},kind.eq.本計算),and(source_period.eq.${period},kind.eq.次期差分)`)) as { party_id: number; incentive_amount: number }[];

  const eligible = new Map<number, number>();
  for (const t of trades) eligible.set(t.buyer_party_id, (eligible.get(t.buyer_party_id) ?? 0) + Number(t.amount));
  const already = new Map<number, number>();
  for (const r of existing) already.set(r.party_id, (already.get(r.party_id) ?? 0) + Number(r.incentive_amount));
  const isFirstRun = existing.length === 0;

  const rows = [];
  for (const [partyId, amount] of eligible) {
    const r = calculateIncentive({
      period, eligibleAmount: amount,
      rate: { rateBp: rate.rate_bp, thresholdAmount: rate.threshold_amount, taxNumerator: rate.tax_numerator, taxDenominator: rate.tax_denominator, paymentDueDays: rate.payment_due_days },
      payments: payments.filter((p) => p.party_id === partyId).map((p) => ({ amount: Number(p.paid_amount), paidOn: p.paid_on })),
    });
    const common = { party_id: partyId, rate_version_id: rate.id, eligible_amount: amount, billed_amount: r.billedAmount, paid_amount: r.paidByDue,
      due_date: r.dueDate, last_paid_on: r.lastPaidOn, on_time: r.onTime, calculated_by: user.id };
    if (isFirstRun) {
      rows.push({ ...common, period, kind: '本計算', incentive_amount: r.incentiveAmount });
    } else {
      const delta = deltaForNextPeriod(period, already.get(partyId) ?? 0, r.incentiveAmount);
      if (delta) rows.push({ ...common, period: delta.period, kind: '次期差分', source_period: period, incentive_amount: delta.amount,
        cause: `${period} の再計算差分（修正依頼・入金の反映）` });
    }
  }
  if (rows.length) unwrap(await db().from('incentive_results').insert(rows));
  await audit(user, isFirstRun ? '奨励金計算' : '奨励金再計算', 'incentive', period, null,
    { rate_version: rate.version_no, rows: rows.length, total: rows.reduce((s, r) => s + r.incentive_amount, 0) });
  return { period, rateVersion: rate.version_no, kind: isFirstRun ? '本計算' : '次期差分', inserted: rows.length };
});
