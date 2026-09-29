// 取引詳細（引渡し・修正依頼・赤黒・監査履歴）と操作: 確定、取消
import { ApiError, currentUser, handle, readJson, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { db } from '@/lib/supabase/service-role-client';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req, { params }: Ctx) => {
  await currentUser();
  const { id } = await params;
  const trade = unwrap(await db().from('trades')
    .select('*, lots(id, lot_code, available_qty, items(name, unit)), parties(id, code, name, party_type), creator:profiles!trades_created_by_fkey(display_name), confirmer:profiles!trades_confirmed_by_fkey(display_name)')
    .eq('id', id).maybeSingle()) as { trade_code: string; business_day: string } | null;
  if (!trade) throw new ApiError(404, '取引が見つかりません');
  const [deliveries, corrections, adjustments, history, locked] = await Promise.all([
    db().from('deliveries').select('*, recorder:profiles(display_name)').eq('trade_id', id).order('seq'),
    db().from('corrections').select('*').eq('trade_id', id).order('id'),
    db().from('trades').select('id, trade_code, entry_kind, business_day, qty, unit_price, amount').eq('adjusts_trade_id', id).order('id'),
    db().from('audit_logs').select('*').eq('entity', 'trade').like('entity_id', `${trade.trade_code}%`).order('at'),
    db().from('business_days').select('locked').eq('day', trade.business_day).maybeSingle(),
  ]);
  return {
    trade, deliveries: unwrap(deliveries), corrections: unwrap(corrections), adjustments: unwrap(adjustments), history: unwrap(history),
    dayLocked: Boolean((unwrap(locked) as { locked: boolean } | null)?.locked),
  };
});

export const POST = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const body = await readJson<{ action?: 'confirm' | 'cancel'; reason?: string }>(req);
  const trade = unwrap(await db().from('trades').select('trade_type').eq('id', id).single()) as { trade_type: string };
  if (body.action === 'confirm') {
    const user = await requirePermission(trade.trade_type === 'せり' ? 'seri.approve' : 'trade.write');
    return unwrap(await db().rpc('fn_confirm_trade', { p_trade_id: Number(id), p_actor: user.id }));
  }
  if (body.action === 'cancel') {
    const user = await requirePermission('trade.write');
    return unwrap(await db().rpc('fn_cancel_trade', { p_trade_id: Number(id), p_actor: user.id, p_reason: body.reason ?? '' }));
  }
  throw new ApiError(400, '操作が不正です');
});
