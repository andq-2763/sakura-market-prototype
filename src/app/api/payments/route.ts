// 入金情報の登録（モック: 本来は会計システムの入金CSV取込。Q-09 の仮定）
import { ApiError, handle, readJson, requireNumber, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

export const POST = handle(async (req) => {
  const user = await requirePermission('payment.write');
  const body = await readJson<{ party_id?: number; period?: string; paid_amount?: number; paid_on?: string }>(req);
  const period = requireText(body.period, '対象期');
  if (!/^\d{4}-\d{2}$/.test(period)) throw new ApiError(400, '対象期は YYYY-MM 形式です');
  const row = unwrap(await db().from('payments').insert({
    party_id: body.party_id, period, paid_amount: Math.round(requireNumber(body.paid_amount, '入金額', { min: 1 })),
    paid_on: requireText(body.paid_on, '入金日'), recorded_by: user.id,
  }).select('*, parties(code)').single()) as { parties: { code: string } };
  await audit(user, '入金登録', 'payment', `${row.parties.code}/${period}`, null, row);
  return row;
});
