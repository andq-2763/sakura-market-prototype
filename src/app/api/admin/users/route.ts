// アカウント管理: 一覧とロール変更・停止/再開（FR-IAM-02）。自分自身は停止・降格できない
import { ApiError, handle, readJson, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { isRole } from '@/lib/permissions';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async () => {
  await requirePermission('admin.users');
  return unwrap(await db().from('profiles').select('id, email, display_name, role, active, created_at').order('email'));
});

export const PATCH = handle(async (req) => {
  const user = await requirePermission('admin.users');
  const body = await readJson<{ id?: string; role?: string; active?: boolean }>(req);
  if (!body.id) throw new ApiError(400, '対象アカウントを指定してください');
  if (body.id === user.id) throw new ApiError(409, '自分自身のロール変更・停止はできません');
  const before = unwrap(await db().from('profiles').select('role, active, email').eq('id', body.id).single()) as { role: string; active: boolean; email: string };
  const patch: { role?: string; active?: boolean } = {};
  if (body.role !== undefined) {
    if (!isRole(body.role)) throw new ApiError(400, 'ロールが不正です');
    patch.role = body.role;
  }
  if (body.active !== undefined) patch.active = Boolean(body.active);
  const after = unwrap(await db().from('profiles').update(patch).eq('id', body.id).select().single());
  await audit(user, '権限変更', 'account', before.email, { role: before.role, active: before.active }, patch);
  return after;
});
