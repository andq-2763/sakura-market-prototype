// 日次照合表（FR-SETTLE-01）と業務日ロック（FR-SETTLE-02）
import { currentUser, handle, readJson, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { assertIsoDate, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

type Row = { trade_type: string; status: string; entry_kind: string; amount: number; qty: number; delivery_status: string; deliveries: { qty: number }[] };

export const GET = handle(async (req) => {
  await currentUser();
  const today = await currentBusinessDay();
  const day = assertIsoDate(new URL(req.url).searchParams.get('day'), today);
  const [rowsRes, dayRes, daysRes] = await Promise.all([
    db().from('trades').select('id, trade_code, trade_type, status, entry_kind, qty, unit_price, amount, delivery_status, adjusts_trade_id, lots(lot_code, items(name, unit)), parties(code, name), deliveries(qty)')
      .eq('business_day', day).order('trade_code'),
    db().from('business_days').select('*, locker:profiles(display_name)').eq('day', day).maybeSingle(),
    db().from('business_days').select('day, locked').order('day', { ascending: false }).limit(14),
  ]);
  const rows = (unwrap(rowsRes) as Row[]).map((r) => {
    const delivered = r.deliveries.reduce((s, d) => s + Number(d.qty), 0);
    const flag = r.status !== '確定' ? '未確定' : r.entry_kind !== '通常' ? '調整' : r.delivery_status === '例外' ? '引渡し例外'
      : r.delivery_status !== '完了' ? '引渡し未完了' : '';
    return { ...r, delivered, flag };
  });
  const confirmed = rows.filter((r) => r.status === '確定');
  const sum = (list: Row[]) => list.reduce((s, r) => s + Number(r.amount), 0);
  return {
    day, today, dayInfo: unwrap(dayRes), recentDays: unwrap(daysRes), rows,
    summary: {
      相対: { count: confirmed.filter((r) => r.trade_type === '相対' && r.entry_kind === '通常').length, amount: sum(confirmed.filter((r) => r.trade_type === '相対')) },
      せり: { count: confirmed.filter((r) => r.trade_type === 'せり' && r.entry_kind === '通常').length, amount: sum(confirmed.filter((r) => r.trade_type === 'せり')) },
      adjustments: confirmed.filter((r) => r.entry_kind !== '通常').length,
      unconfirmed: rows.filter((r) => r.status === '下書き' || r.status === '確認待ち').length,
      deliveryIssues: rows.filter((r) => r.flag === '引渡し例外' || r.flag === '引渡し未完了').length,
      total: sum(confirmed),
    },
  };
});

export const POST = handle(async (req) => {
  const user = await requirePermission('settle.lock');
  const body = await readJson<{ day?: string }>(req);
  return unwrap(await db().rpc('fn_lock_business_day', { p_day: requireText(body.day, '業務日'), p_actor: user.id }));
});
