'use client';
// 参加者詳細（SCR-021）と参加資格の登録・一時停止（SCR-022）
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Table, Td, num, yen } from '@/components/ui-primitives';

type Detail = {
  party: { id: number; code: string; name: string; party_type: string; email: string | null };
  status: { basis: string; status: string; validTo: string | null };
  qualifications: { id: number; basis: string; certificate_no: string; valid_from: string; valid_to: string; suspended: boolean; note: string | null }[];
  trades: { id: number; trade_code: string; trade_type: string; business_day: string; qty: number; amount: number; status: string; entry_kind: string; lots: { lot_code: string; items: { name: string } } }[];
};

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useMe();
  const { data, loading, error, reload } = useApi<Detail>(`/api/parties/${id}`);
  const [form, setForm] = useState({ certificate_no: '', valid_from: '', valid_to: '', note: '' });
  const { busy, message, run } = useAction();

  const addQualification = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => apiSend(`/api/parties/${id}/qualifications`, { ...form, basis: data?.status.basis }), '参加資格を登録しました')) reload();
  };
  const toggleSuspend = async (qid: number, suspended: boolean) => {
    const reason = window.prompt(suspended ? '一時停止の理由' : '一時停止解除の理由');
    if (!reason) return;
    if (await run(() => apiSend(`/api/parties/${id}/qualifications`, { qualification_id: qid, suspended, reason }, 'PATCH'), suspended ? '一時停止しました' : '一時停止を解除しました')) reload();
  };

  return (
    <>
      <PageHeader title={data ? `${data.party.code} ${data.party.name}` : '参加者詳細'} actions={<Link href="/parties" className="text-sm text-sky-700">← 参加者一覧</Link>} />
      <LoadState loading={loading} error={error} />
      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="プロファイル">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500">参加区分</dt><dd>{data.party.party_type}</dd>
              <dt className="text-slate-500">参加根拠</dt><dd>{data.status.basis}</dd>
              <dt className="text-slate-500">資格状態</dt><dd><Badge>{data.status.status}</Badge></dd>
              <dt className="text-slate-500">最終有効日</dt><dd>{data.status.validTo ?? '—'}</dd>
              <dt className="text-slate-500">連絡先</dt><dd className="text-xs">{data.party.email}</dd>
            </dl>
          </Card>
          <Card title={`参加資格（${data.status.basis}）の履歴`} className="lg:col-span-2">
            <Table head={['証番号', '有効開始日', '最終有効日', '一時停止', '備考', '']}>
              {data.qualifications.map((q) => (
                <tr key={q.id}>
                  <Td>{q.certificate_no}</Td><Td>{q.valid_from}</Td><Td>{q.valid_to}</Td><Td>{q.suspended ? <Badge>一時停止</Badge> : '—'}</Td><Td>{q.note}</Td>
                  <Td>{can('party.write') && <Button variant="secondary" disabled={busy} onClick={() => toggleSuspend(q.id, !q.suspended)}>{q.suspended ? '停止解除' : '一時停止'}</Button>}</Td>
                </tr>
              ))}
            </Table>
            {can('party.write') && (
              <form onSubmit={addQualification} className="mt-4 grid gap-2 sm:grid-cols-5 sm:items-end">
                <Field label={`${data.status.basis}の証番号`}><Input required value={form.certificate_no} onChange={(e) => setForm({ ...form, certificate_no: e.target.value })} /></Field>
                <Field label="有効開始日"><Input required type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></Field>
                <Field label="最終有効日" hint="この業務日の終了まで有効"><Input required type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} /></Field>
                <Field label="備考"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
                <Button disabled={busy} className="py-2">資格を登録（更新）</Button>
              </form>
            )}
            <div className="mt-2"><Message message={message} /></div>
          </Card>
          <Card title="直近の取引" className="lg:col-span-3">
            <Table head={['取引コード', '業務日', '種別', '区分', 'ロット・品目', '数量', '金額', '状態']}>
              {data.trades.map((t) => (
                <tr key={t.id}>
                  <Td><Link href={`/trades/${t.id}`} className="text-sky-700 hover:underline">{t.trade_code}</Link></Td><Td>{t.business_day}</Td>
                  <Td><Badge>{t.trade_type}</Badge></Td><Td>{t.entry_kind === '通常' ? '' : <Badge>{t.entry_kind}</Badge>}</Td>
                  <Td>{t.lots.lot_code} {t.lots.items.name}</Td><Td>{num(t.qty)}</Td><Td>{yen(t.amount)}</Td><Td><Badge>{t.status}</Badge></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
