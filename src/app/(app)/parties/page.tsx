'use client';
// 参加者一覧（SCR-020）と登録。参加区分ごとに参加根拠が異なる（許可と承認を統合しない）
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Select, Table, Td } from '@/components/ui-primitives';

type Party = { id: number; code: string; name: string; party_type: string; email: string | null;
  qualification: { basis: string; status: string; validTo: string | null; daysLeft?: number } };

const TYPES = ['卸売業者', '仲卸', '売買参加者', '買出人'];

export default function PartiesPage() {
  const { can } = useMe();
  const { data, loading, error, reload } = useApi<Party[]>('/api/parties');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ code: '', name: '', party_type: '仲卸', email: '' });
  const { busy, message, run } = useAction();
  const rows = data?.filter((p) => !filter || p.party_type === filter || p.qualification.status === filter) ?? [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => apiSend('/api/parties', form), '参加者を登録しました。続けて参加資格を登録してください')) { setForm({ ...form, code: '', name: '', email: '' }); reload(); }
  };

  return (
    <>
      <PageHeader title="参加者・参加資格" description="卸売業者＝市場登録、仲卸＝許可、売買参加者＝承認、買出人＝取引地点登録。取引確定時点で有効性を判定します。" />
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {['', ...TYPES, '失効間近', '期限切れ', '一時停止'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded border px-2 py-1 ${filter === f ? 'border-sky-700 bg-sky-50' : 'border-slate-300 bg-white'}`}>{f || 'すべて'}</button>
        ))}
      </div>
      <LoadState loading={loading} error={error} />
      <Card className="mb-4">
        <Table head={['コード', '名称', '参加区分', '参加根拠', '資格状態', '最終有効日', '連絡先']}>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td><Link href={`/parties/${p.id}`} className="font-medium text-sky-700 hover:underline">{p.code}</Link></Td>
              <Td>{p.name}</Td><Td>{p.party_type}</Td><Td>{p.qualification.basis}</Td><Td><Badge>{p.qualification.status}</Badge></Td>
              <Td>{p.qualification.validTo ?? '—'}{p.qualification.status === '失効間近' && <span className="ml-1 text-xs text-amber-700">（残り{p.qualification.daysLeft}日）</span>}</Td>
              <Td className="text-xs text-slate-500">{p.email}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      {can('party.write') && (
        <Card title="参加者の登録">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-5 md:items-end">
            <Field label="参加者コード"><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="名称"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="参加区分">
              <Select value={form.party_type} onChange={(e) => setForm({ ...form, party_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            </Field>
            <Field label="メール（架空）"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Button disabled={busy} className="py-2">登録</Button>
          </form>
          <div className="mt-3"><Message message={message} /></div>
        </Card>
      )}
    </>
  );
}
