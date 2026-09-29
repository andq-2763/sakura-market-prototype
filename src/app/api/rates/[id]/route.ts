// 料率版の承認（起票者≠承認者）とロールバック（GOV-RULE-01）
import { ApiError, handle, readJson, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

type Rate = { id: number; version_no: number; status: string; created_by: string };

export const POST = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await readJson<{ action?: 'approve' | 'rollback'; reason?: string }>(req);
  const rate = unwrap(await db().from('rate_versions').select('id, version_no, status, created_by').eq('id', id).single()) as Rate;

  if (body.action === 'approve') {
    const user = await requirePermission('rate.approve');
    if (rate.status !== '草案') throw new ApiError(409, `草案のみ承認できます（現在: ${rate.status}）`);
    if (rate.created_by === user.id) throw new ApiError(409, '起票者本人は承認できません（起票・承認分離）');
    const after = unwrap(await db().from('rate_versions').update({ status: '承認済', approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', id).eq('status', '草案').select().single());
    await audit(user, '料率版承認', 'rate_version', `v${rate.version_no}`, { status: '草案' }, { status: '承認済' });
    return after;
  }
  if (body.action === 'rollback') {
    const user = await requirePermission('rate.draft');
    const reason = requireText(body.reason, 'ロールバック理由');
    if (rate.status !== '承認済') throw new ApiError(409, `承認済の版のみロールバックできます（現在: ${rate.status}）`);
    const after = unwrap(await db().from('rate_versions').update({ status: 'ロールバック', rolled_back_by: user.id, rolled_back_at: new Date().toISOString() })
      .eq('id', id).eq('status', '承認済').select().single());
    await audit(user, '料率版ロールバック', 'rate_version', `v${rate.version_no}`, { status: '承認済' }, { status: 'ロールバック' }, reason);
    return after;
  }
  throw new ApiError(400, '操作が不正です');
});
