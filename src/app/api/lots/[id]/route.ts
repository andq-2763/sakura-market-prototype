// ロット詳細と状態操作: 目利き結果の記録（人が判定、FR-LOT-02）、販売公開
import { ApiError, currentUser, handle, readJson, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

type Ctx = { params: Promise<{ id: string }> };
type Lot = { id: number; lot_code: string; status: string; judge_result: string | null; business_days: { locked: boolean } | null };
const GRADES = ['特選', '上', '並', '規格外'];

export const GET = handle(async (_req, { params }: Ctx) => {
  await currentUser();
  const { id } = await params;
  const lot = unwrap(await db().from('lots').select('*, items(name, unit), shippers(name), judge:profiles!lots_judged_by_fkey(display_name)')
    .eq('id', id).maybeSingle());
  if (!lot) throw new ApiError(404, 'ロットが見つかりません');
  const trades = unwrap(await db().from('trades').select('id, trade_code, trade_type, qty, unit_price, amount, status, entry_kind, delivery_status, parties(code, name)')
    .eq('lot_id', id).order('id'));
  return { lot, trades };
});

export const POST = handle(async (req, { params }: Ctx) => {
  const { id } = await params;
  const body = await readJson<{ action?: 'judge' | 'publish'; judge_result?: string }>(req);
  const lot = unwrap(await db().from('lots').select('id, lot_code, status, judge_result, business_days(locked)').eq('id', id).single()) as Lot;
  if (lot.business_days?.locked) throw new ApiError(409, 'ロック済み業務日のロットは変更できません');
  if (body.action === 'judge') {
    const user = await requirePermission('lot.judge');
    if (!GRADES.includes(body.judge_result ?? '')) throw new ApiError(400, '評価結果を選択してください');
    if (!['受付', '下見済'].includes(lot.status)) throw new ApiError(409, `販売開始後のロットの評価は変更できません（現在: ${lot.status}）`);
    const after = unwrap(await db().from('lots').update({ judge_result: body.judge_result, judged_by: user.id,
      judged_at: new Date().toISOString(), status: '下見済' }).eq('id', id).select().single());
    await audit(user, '目利き結果記録', 'lot', lot.lot_code, { judge_result: lot.judge_result, status: lot.status },
      { judge_result: body.judge_result, status: '下見済' });
    return after;
  }
  if (body.action === 'publish') {
    const user = await requirePermission('lot.write');
    if (lot.status !== '下見済') throw new ApiError(409, `下見済のロットのみ公開できます（現在: ${lot.status}）`);
    const after = unwrap(await db().from('lots').update({ status: '公開' }).eq('id', id).select().single());
    await audit(user, 'ロット公開', 'lot', lot.lot_code, { status: lot.status }, { status: '公開' });
    return after;
  }
  throw new ApiError(400, '操作が不正です');
});
