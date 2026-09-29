'use client';
// アカウント管理（SCR-010/011）: ロール変更と停止・再開。変更はすべて監査ログに残る
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, LoadState, Message, PageHeader, Select, Table, Td, dateTime } from '@/components/ui-primitives';
import { ROLES } from '@/lib/permissions';

type Profile = { id: string; email: string; display_name: string; role: string; active: boolean; created_at: string };

export default function UsersPage() {
  const { me } = useMe();
  const { data, loading, error, reload } = useApi<Profile[]>('/api/admin/users');
  const { busy, message, run } = useAction();
  const update = async (id: string, patch: { role?: string; active?: boolean }) => {
    if (await run(() => apiSend('/api/admin/users', { id, ...patch }, 'PATCH'), '更新しました')) reload();
  };

  return (
    <>
      <PageHeader title="アカウント管理" description="アカウントの作成は Supabase Auth（npm run db:setup のデモユーザー）で行います。MFA はプロトタイプの範囲外です。" />
      <Message message={message} />
      <LoadState loading={loading} error={error} />
      <Card className="mt-3">
        <Table head={['メール', '氏名', 'ロール', '状態', '作成日時', '']}>
          {data?.map((p) => (
            <tr key={p.id}>
              <Td className="text-xs">{p.email}</Td><Td>{p.display_name}</Td>
              <Td>
                <Select className="w-52" disabled={busy || p.id === me?.user.id} value={p.role} onChange={(e) => update(p.id, { role: e.target.value })} aria-label={`${p.email} のロール`}>
                  {Object.entries(ROLES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </Select>
              </Td>
              <Td><Badge>{p.active ? '有効' : '一時停止'}</Badge></Td><Td>{dateTime(p.created_at)}</Td>
              <Td>{p.id === me?.user.id ? <span className="text-xs text-slate-500">自分</span> : (
                <Button variant={p.active ? 'danger' : 'secondary'} disabled={busy} onClick={() => update(p.id, { active: !p.active })}>{p.active ? '停止' : '再開'}</Button>
              )}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
