// ロール×権限マトリクスの照会と変更。管理者が自らを締め出さないよう admin.* の剥奪は禁止
import { ApiError, handle, readJson, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { isPermission, isRole } from '@/lib/permissions';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async () => {
  await requirePermission('admin.roles');
  return unwrap(await db().from('role_permissions').select('role, permission'));
});

export const PUT = handle(async (req) => {
  const user = await requirePermission('admin.roles');
  const body = await readJson<{ role?: string; permission?: string; granted?: boolean }>(req);
  if (!body.role || !isRole(body.role) || !body.permission || !isPermission(body.permission)) throw new ApiError(400, 'ロールまたは権限が不正です');
  if (body.role === 'ROLE-SYS-ADMIN' && body.permission.startsWith('admin.') && !body.granted) {
    throw new ApiError(409, 'システム管理者から管理権限は外せません（締め出し防止）');
  }
  if (body.granted) {
    unwrap(await db().from('role_permissions').upsert({ role: body.role, permission: body.permission }, { ignoreDuplicates: true }));
  } else {
    unwrap(await db().from('role_permissions').delete().eq('role', body.role).eq('permission', body.permission));
  }
  await audit(user, body.granted ? '権限付与' : '権限剥奪', 'role', body.role, null, { permission: body.permission, granted: Boolean(body.granted) });
  return { ok: true };
});
