'use client';
// 料率版管理（SCR-100〜102）: 将来発効日つきで起票 → 別の承認者が承認 → 必要ならロールバック
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Table, Td, dateTime, yen } from '@/components/ui-primitives';

type Rate = { id: number; version_no: number; effective_from: string; rate_bp: number; threshold_amount: number; payment_due_days: number; status: string; note: string | null;
  created_by: string; created_at: string; approved_at: string | null; creator: { display_name: string } | null; approver: { display_name: string } | null };

export default function RatesPage() {
  const { can, me } = useMe();
  const { data, loading, error, reload } = useApi<Rate[]>('/api/rates');
  const [form, setForm] = useState({ effective_from: '', rate_percent: '1.50', threshold_amount: '100000', payment_due_days: '10', note: '' });
  const draft = useAction();
  const act = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await draft.run(() => apiSend('/api/rates', { ...form, rate_bp: Math.round(Number(form.rate_percent) * 100),
      threshold_amount: Number(form.threshold_amount), payment_due_days: Number(form.payment_due_days) }), '草案を起票しました（承認されるまで適用されません）');
    if (ok) reload();
  };
  const operate = async (r: Rate, action: 'approve' | 'rollback') => {
    const reason = action === 'rollback' ? window.prompt('ロールバックの理由を入力してください') : undefined;
    if (action === 'rollback' && !reason) return;
    if (await act.run(() => apiSend(`/api/rates/${r.id}`, { action, reason }), action === 'approve' ? `v${r.version_no} を承認しました` : `v${r.version_no} をロールバックしました`)) reload();
  };

  return (
    <>
      <PageHeader title="料率版管理" description="規則・料率の変更は年4回まで。起票者と承認者を分け、発効日前に確定したデータは変わりません（GOV-RULE-01）。" />
      {can('rate.draft') && (
        <Card title="新しい料率版の起票" className="mb-4">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-6 md:items-end">
            <Field label="発効日（翌業務日以降）"><Input required type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} /></Field>
            <Field label="交付率（%）"><Input required type="number" step="0.01" min="0" max="100" value={form.rate_percent} onChange={(e) => setForm({ ...form, rate_percent: e.target.value })} /></Field>
            <Field label="最低閾値（円・以上）"><Input required type="number" min="0" value={form.threshold_amount} onChange={(e) => setForm({ ...form, threshold_amount: e.target.value })} /></Field>
            <Field label="支払日数（期末から）"><Input required type="number" min="0" value={form.payment_due_days} onChange={(e) => setForm({ ...form, payment_due_days: e.target.value })} /></Field>
            <Field label="備考"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <Button disabled={draft.busy} className="py-2">起票</Button>
          </form>
          <div className="mt-3"><Message message={draft.message} /></div>
        </Card>
      )}
      <Card title="料率版の履歴">
        <Message message={act.message} />
        <LoadState loading={loading} error={error} />
        <Table head={['版', '発効日', '交付率', '最低閾値', '支払日数', '税係数', '状態', '起票者', '承認者', '備考', '']}>
          {data?.map((r) => (
            <tr key={r.id}>
              <Td className="font-bold">v{r.version_no}</Td><Td>{r.effective_from}</Td><Td>{(r.rate_bp / 100).toFixed(2)}%</Td>
              <Td className="text-right">{yen(r.threshold_amount)}</Td><Td>{r.payment_due_days}日</Td><Td>110/100</Td><Td><Badge>{r.status}</Badge></Td>
              <Td>{r.creator?.display_name}<br /><span className="text-xs text-slate-500">{dateTime(r.created_at)}</span></Td>
              <Td>{r.approver?.display_name ?? '—'}<br /><span className="text-xs text-slate-500">{dateTime(r.approved_at)}</span></Td>
              <Td>{r.note}</Td>
              <Td>
                {r.status === '草案' && can('rate.approve') && (r.created_by === me?.user.id
                  ? <span className="text-xs text-amber-800">起票者は承認不可</span>
                  : <Button disabled={act.busy} onClick={() => operate(r, 'approve')}>承認</Button>)}
                {r.status === '承認済' && can('rate.draft') && <Button variant="secondary" disabled={act.busy} onClick={() => operate(r, 'rollback')}>ロールバック</Button>}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
