// 取引一覧と取引作成。相対は「確定」まで1回で行える（拒否時は取引を作らない）。せりは確認待ちで登録
import { ApiError, currentUser, handle, readJson, requireNumber, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { assertIsoDate, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async (req) => {
  await currentUser();
  const url = new URL(req.url);
  const day = assertIsoDate(url.searchParams.get('day'), await currentBusinessDay());
  let q = db().from('trades')
    .select('id, trade_code, trade_type, business_day, qty, unit_price, amount, status, delivery_status, entry_kind, seri_time, created_at, lots(lot_code, items(name, unit)), parties(code, name, party_type)')
    .eq('business_day', day).order('id', { ascending: false });
  for (const key of ['trade_type', 'status'] as const) {
    const v = url.searchParams.get(key);
    if (v) q = q.eq(key, v);
  }
  return { day, trades: unwrap(await q) };
});

type Body = { trade_type?: '相対' | 'せり'; lot_id?: number; buyer_party_id?: number; qty?: number; unit_price?: number; seri_time?: string; confirm?: boolean };

export const POST = handle(async (req) => {
  const body = await readJson<Body>(req);
  const isSeri = body.trade_type === 'せり';
  const user = await requirePermission(isSeri ? 'seri.write' : 'trade.write');
  if (!body.lot_id || !body.buyer_party_id) throw new ApiError(400, 'ロットと買手を選択してください');
  if (isSeri && !/^\d{2}:\d{2}$/.test(body.seri_time ?? '')) throw new ApiError(400, 'せりの結果時刻（HH:MM）を入力してください');
  return unwrap(await db().rpc('fn_create_trade', {
    p_type: isSeri ? 'せり' : '相対',
    p_lot_id: body.lot_id,
    p_buyer: body.buyer_party_id,
    p_qty: requireNumber(body.qty, '数量', { min: 0.1 }),
    p_unit_price: Math.round(requireNumber(body.unit_price, '単価')),
    p_seri_time: isSeri ? body.seri_time : null,
    p_confirm: !isSeri && Boolean(body.confirm),
    p_actor: user.id,
  }));
});
