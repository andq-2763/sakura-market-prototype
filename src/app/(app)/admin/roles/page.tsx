'use client';
// ロール・権限設定（SCR-012）: ロール×権限のマトリクスを切り替える。API側でも同じ権限表で認可する
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Card, LoadState, Message, PageHeader } from '@/components/ui-primitives';
import { PERMISSIONS, ROLES, type Permission, type Role } from '@/lib/permissions';

export default function RolesPage() {
  const { data, loading, error, reload } = useApi<{ role: Role; permission: Permission }[]>('/api/admin/roles');
  const { busy, message, run } = useAction();
  const has = (role: string, perm: string) => Boolean(data?.some((r) => r.role === role && r.permission === perm));
  const toggle = async (role: string, permission: string) => {
    const granted = !has(role, permission);
    if (await run(() => apiSend('/api/admin/roles', { role, permission, granted }, 'PUT'), `${ROLES[role as Role]}: ${PERMISSIONS[permission as Permission]} を${granted ? '付与' : '剥奪'}しました`)) reload();
  };

  return (
    <>
      <PageHeader title="ロール・権限設定" description="職務分離（起票者≠承認者）は権限とは別に、記録単位でDBが強制します。変更は次のリクエストから反映されます。" />
      <Message message={message} />
      <LoadState loading={loading} error={error} />
      {data && (
        <Card className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-2 py-2 text-left font-medium">権限</th>
                  {Object.values(ROLES).map((r) => <th key={r} className="px-2 py-2 font-medium">{r}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(PERMISSIONS).map(([perm, label]) => (
                  <tr key={perm}>
                    <td className="px-2 py-1.5"><span className="font-medium">{label}</span><span className="ml-1 text-xs text-slate-400">{perm}</span></td>
                    {Object.keys(ROLES).map((role) => (
                      <td key={role} className="px-2 py-1.5 text-center">
                        <input type="checkbox" className="h-4 w-4" disabled={busy} checked={has(role, perm)} onChange={() => toggle(role, perm)}
                          aria-label={`${ROLES[role as Role]} ${label}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
