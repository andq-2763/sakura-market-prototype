// 帳票CSV出力: RPT-01 日次取引集計、RPT-06 会計照合用出力（IF-ACC-01。ロック済み業務日のみ）
import { ApiError, handle, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { assertIsoDate, audit, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { toCsvResponse } from '@/lib/csv-response';
import { db } from '@/lib/supabase/service-role-client';

type TradeRow = { trade_code: string; trade_type: string; status: string; entry_kind: string; qty: number; unit_price: number; amount: number;
  delivery_status: string; buyer_party_id: number; lots: { lot_code: string; items: { name: string; unit: string } }; parties: { code: string; name: string } };

export const GET = handle(async (req, { params }: { params: Promise<{ report: string }> }) => {
  const user = await requirePermission('report.export');
  const { report } = await params;
  const day = assertIsoDate(new URL(req.url).searchParams.get('day'), await currentBusinessDay());
  const trades = unwrap(await db().from('trades').select('trade_code, trade_type, status, entry_kind, qty, unit_price, amount, delivery_status, buyer_party_id, lots(lot_code, items(name, unit)), parties(code, name)')
    .eq('business_day', day).order('trade_code')) as unknown as TradeRow[];

  if (report === 'daily-trades') {
    await audit(user, '帳票出力', 'report', `RPT-01/${day}`, null, { rows: trades.length });
    return toCsvResponse(`RPT-01_daily-trades_${day}.csv`,
      ['業務日', '取引コード', '取引種別', '区分', '状態', 'ロット', '品目', '買手コード', '買手名', '数量', '単位', '単価', '金額', '引渡し状態'],
      trades.map((t) => [day, t.trade_code, t.trade_type, t.entry_kind, t.status, t.lots.lot_code, t.lots.items.name, t.parties.code, t.parties.name,
        t.qty, t.lots.items.unit, t.unit_price, t.amount, t.delivery_status]));
  }
  if (report === 'accounting') {
    const dayRow = unwrap(await db().from('business_days').select('locked').eq('day', day).maybeSingle()) as { locked: boolean } | null;
    if (!dayRow?.locked) throw new ApiError(409, `業務日 ${day} はロックされていないため会計連携データを出力できません`);
    const batchCode = `ACC-${day.replaceAll('-', '')}-01`;
    const byParty = new Map<string, { name: string; total: number; adjusted: boolean }>();
    for (const t of trades.filter((x) => x.status === '確定')) {
      const e = byParty.get(t.parties.code) ?? { name: t.parties.name, total: 0, adjusted: false };
      e.total += Number(t.amount);
      e.adjusted ||= t.entry_kind !== '通常';
      byParty.set(t.parties.code, e);
    }
    await audit(user, '会計連携出力', 'report', batchCode, null, { parties: byParty.size });
    return toCsvResponse(`IF-ACC-01_${batchCode}.csv`, ['バッチコード', '業務日', '参加者コード', '参加者名', '総額（税抜）', '税額（8%）', '行ステータス'],
      [...byParty].map(([code, e]) => [batchCode, day, code, e.name, e.total, Math.floor((e.total * 8) / 100), e.adjusted ? '調整済' : '確認済']));
  }
  throw new ApiError(404, '帳票が見つかりません');
});
