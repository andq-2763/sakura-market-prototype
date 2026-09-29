// ロット一覧（業務日・状態）とロット受付登録（FR-LOT-01）
import { ApiError, currentUser, handle, readJson, requireNumber, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { assertIsoDate, audit, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async (req) => {
  await currentUser();
  const url = new URL(req.url);
  const day = assertIsoDate(url.searchParams.get('day'), await currentBusinessDay());
  let q = db().from('lots').select('*, items(name, unit), shippers(name)').eq('business_day', day).order('lot_code');
  const status = url.searchParams.get('status');
  if (status) q = q.eq('status', status);
  return { day, lots: unwrap(await q) };
});

export const POST = handle(async (req) => {
  const user = await requirePermission('lot.write');
  const body = await readJson<{ shipper_id?: number; item_id?: number; initial_qty?: number }>(req);
  const qty = requireNumber(body.initial_qty, '初期数量', { min: 0.1 });
  const day = await currentBusinessDay();
  unwrap(await db().from('business_days').upsert({ day }, { onConflict: 'day', ignoreDuplicates: true }));
  const dayRow = unwrap(await db().from('business_days').select('locked').eq('day', day).single()) as { locked: boolean };
  if (dayRow.locked) throw new ApiError(409, `業務日 ${day} はロック済みです`);
  const compact = day.replaceAll('-', '').slice(2);
  const { count } = await db().from('lots').select('id', { count: 'exact', head: true }).eq('business_day', day);
  const lotCode = `L${compact}-${String((count ?? 0) + 1).padStart(3, '0')}`;
  const { data, error } = await db().from('lots').insert({
    lot_code: lotCode, business_day: day, shipper_id: body.shipper_id, item_id: body.item_id,
    initial_qty: qty, available_qty: qty, created_by: user.id,
  }).select().single();
  if (error?.code === '23505') throw new ApiError(409, '同時登録によりロットコードが重複しました。もう一度登録してください');
  if (error?.code === '23503') throw new ApiError(400, '荷主または品目が不正です');
  const lot = unwrap({ data, error });
  await audit(user, 'ロット受付', 'lot', lotCode, null, lot);
  return lot;
});
