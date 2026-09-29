// 修正依頼の審査: 承認なら赤黒レコードを生成、却下・追加情報要求はコメント必須。起票者本人は審査不可（DBで強制）
import { ApiError, handle, readJson, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { db } from '@/lib/supabase/service-role-client';

export const POST = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requirePermission('correction.approve');
  const { id } = await params;
  const body = await readJson<{ decision?: string; comment?: string }>(req);
  if (body.decision === '承認') {
    return unwrap(await db().rpc('fn_approve_correction', { p_correction_id: Number(id), p_actor: user.id, p_comment: body.comment ?? null }));
  }
  if (body.decision === '却下' || body.decision === '追加情報要求') {
    return unwrap(await db().rpc('fn_review_correction', {
      p_correction_id: Number(id), p_actor: user.id, p_decision: body.decision, p_comment: body.comment ?? '',
    }));
  }
  throw new ApiError(400, '判定を選択してください');
});
