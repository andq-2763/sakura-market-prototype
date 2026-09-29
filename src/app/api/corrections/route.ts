// 修正依頼（FORM-CORR-01）の一覧と起票。元取引は承認まで変更しない
import { ApiError, currentUser, handle, readJson, requireNumber, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async (req) => {
  await currentUser();
  const status = new URL(req.url).searchParams.get('status');
  let q = db().from('corrections')
    .select('*, trades!corrections_trade_id_fkey(id, trade_code, business_day, qty, unit_price, amount, parties(code, name)), requester:profiles!corrections_requested_by_fkey(display_name), reviewer:profiles!corrections_reviewed_by_fkey(display_name)')
    .order('id', { ascending: false });
  if (status) q = q.eq('status', status);
  return unwrap(await q);
});

type Body = { trade_id?: number; new_qty?: number; new_unit_price?: number; reason?: string; evidence_note?: string };

export const POST = handle(async (req) => {
  const user = await requirePermission('correction.request');
  const body = await readJson<Body>(req);
  const trade = unwrap(await db().from('trades').select('id, trade_code, status, entry_kind, qty, unit_price').eq('id', body.trade_id ?? -1).maybeSingle()) as
    { id: number; trade_code: string; status: string; entry_kind: string; qty: number; unit_price: number } | null;
  if (!trade) throw new ApiError(404, '取引が見つかりません');
  if (trade.status !== '確定' || trade.entry_kind !== '通常') throw new ApiError(409, '確定済みの通常取引のみ修正依頼できます');
  const newQty = requireNumber(body.new_qty, '訂正後数量');
  const newPrice = Math.round(requireNumber(body.new_unit_price, '訂正後単価'));
  if (newQty === Number(trade.qty) && newPrice === trade.unit_price) throw new ApiError(400, '数量または単価を変更してください');
  const { count } = await db().from('corrections').select('id', { count: 'exact', head: true });
  const code = `CR-${String((count ?? 0) + 1).padStart(4, '0')}`;
  const row = unwrap(await db().from('corrections').insert({
    correction_code: code, trade_id: trade.id, new_qty: newQty, new_unit_price: newPrice,
    reason: requireText(body.reason, '修正理由'), evidence_note: body.evidence_note || null, requested_by: user.id,
  }).select().single());
  await audit(user, '修正依頼起票', 'correction', code, { trade: trade.trade_code, qty: trade.qty, unit_price: trade.unit_price },
    { qty: newQty, unit_price: newPrice }, body.reason);
  return row;
});
