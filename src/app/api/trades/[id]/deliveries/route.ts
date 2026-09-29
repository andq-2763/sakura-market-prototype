// 引渡し記録（分割・例外）。完了判定はDB関数が行う（BR-DEL-03）
import { ApiError, handle, readJson, requireNumber, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { db } from '@/lib/supabase/service-role-client';

const EXCEPTIONS = ['不足', '超過', '返却', '部分キャンセル'];

export const POST = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requirePermission('delivery.write');
  const { id } = await params;
  const body = await readJson<{ qty?: number; exception_type?: string; reason?: string }>(req);
  const exception = body.exception_type || null;
  if (exception && !EXCEPTIONS.includes(exception)) throw new ApiError(400, '例外種別が不正です');
  return unwrap(await db().rpc('fn_record_delivery', {
    p_trade_id: Number(id), p_qty: requireNumber(body.qty, '引渡し数量'), p_exception: exception,
    p_reason: body.reason || null, p_actor: user.id,
  }));
});
