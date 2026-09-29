// 引渡しボード: 確定済みの通常取引と引渡し累積（既定は未完了のみ）
import { currentUser, handle, unwrap } from '@/lib/api/api-route-helpers';
import { db } from '@/lib/supabase/service-role-client';

type Row = { id: number; qty: number; deliveries: { qty: number }[] };

export const GET = handle(async (req) => {
  await currentUser();
  const includeDone = new URL(req.url).searchParams.get('include_done') === '1';
  let q = db().from('trades')
    .select('id, trade_code, trade_type, business_day, qty, delivery_status, lots(lot_code, items(name, unit)), parties(code, name), deliveries(qty, exception_type, recorded_at)')
    .eq('status', '確定').eq('entry_kind', '通常').order('business_day', { ascending: false }).order('trade_code').limit(300);
  if (!includeDone) q = q.in('delivery_status', ['待機中', '引渡し中', '例外']);
  const rows = unwrap(await q) as Row[];
  // 承認済み修正（黒レコード）があれば、その数量を引渡し対象とする
  const blacks = rows.length
    ? unwrap(await db().from('trades').select('adjusts_trade_id, qty').eq('entry_kind', '黒').in('adjusts_trade_id', rows.map((r) => r.id)).order('id')) as { adjusts_trade_id: number; qty: number }[]
    : [];
  const targetById = new Map(blacks.map((b) => [b.adjusts_trade_id, Number(b.qty)]));
  return rows.map((r) => {
    const target = targetById.get(r.id) ?? Number(r.qty);
    const delivered = r.deliveries.reduce((s, d) => s + Number(d.qty), 0);
    return { ...r, target, delivered, remaining: Math.max(target - delivered, 0) };
  });
});
