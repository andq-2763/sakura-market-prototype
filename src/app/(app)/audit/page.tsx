'use client';
// 監査ログ検索（SCR-140）と変更前後の表示（SCR-141）
import { Fragment, useState, type FormEvent } from 'react';
import { useApi } from '@/components/use-api';
import { Card, Field, Input, LoadState, PageHeader, Table, Td, dateTime, Button } from '@/components/ui-primitives';

type Log = { id: number; at: string; actor_email: string | null; action: string; entity: string; entity_id: string | null; before: unknown; after: unknown; reason: string | null };

const show = (v: unknown) => (v === null || v === undefined ? '' : JSON.stringify(v, null, 1));

export default function AuditPage() {
  const [filters, setFilters] = useState({ entity_id: '', action: '', actor: '', from: '', to: '' });
  const [query, setQuery] = useState('');
  const { data, loading, error } = useApi<Log[]>(`/api/audit?${query}`);
  const [open, setOpen] = useState<number | null>(null);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setQuery(new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString());
  };

  return (
    <>
      <PageHeader title="監査ログ" description="作成・修正・承認・ロック・権限変更の実行者、時刻、変更前後、理由を追記のみで記録しています（削除・変更はDBで禁止）。" />
      <Card className="mb-4">
        <form onSubmit={search} className="grid gap-3 md:grid-cols-6 md:items-end">
          <Field label="対象ID（取引コード等）"><Input value={filters.entity_id} onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })} placeholder="例: T2609" /></Field>
          <Field label="操作"><Input value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} placeholder="例: 確定" /></Field>
          <Field label="実行者メール"><Input value={filters.actor} onChange={(e) => setFilters({ ...filters, actor: e.target.value })} /></Field>
          <Field label="日付（から）"><Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Field>
          <Field label="日付（まで）"><Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Field>
          <Button className="py-2">検索</Button>
        </form>
      </Card>
      <LoadState loading={loading} error={error} />
      <Card title={`検索結果（最新200件まで）: ${data?.length ?? 0}件`}>
        <Table head={['日時', '操作', '対象', '実行者', '理由', '']}>
          {data?.map((l) => (
            <Fragment key={l.id}>
              <tr>
                <Td>{dateTime(l.at)}</Td><Td className="font-medium">{l.action}</Td><Td>{l.entity} {l.entity_id}</Td>
                <Td className="text-xs">{l.actor_email}</Td><Td>{l.reason}</Td>
                <Td><button className="text-xs text-sky-700" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? '閉じる' : '変更前後'}</button></Td>
              </tr>
              {open === l.id && (
                <tr>
                  <Td className="bg-slate-50" />
                  <td colSpan={5} className="bg-slate-50 px-2 py-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div><p className="text-xs text-slate-500">変更前</p><pre className="whitespace-pre-wrap text-xs">{show(l.before) || '—'}</pre></div>
                      <div><p className="text-xs text-slate-500">変更後</p><pre className="whitespace-pre-wrap text-xs">{show(l.after) || '—'}</pre></div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      </Card>
    </>
  );
}
