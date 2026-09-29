'use client';
// 完納奨励金（SCR-090 入金登録, SCR-091 計算・結果一覧）
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Select, Table, Td, yen } from '@/components/ui-primitives';

type Result = { id: number; period: string; kind: string; source_period: string | null; cause: string | null; eligible_amount: number; billed_amount: number; paid_amount: number;
  due_date: string; last_paid_on: string | null; on_time: boolean; incentive_amount: number; parties: { code: string; name: string; party_type: string };
  rate_versions: { version_no: number; effective_from: string; rate_bp: number } };
type Payment = { id: number; paid_amount: number; paid_on: string; parties: { code: string; name: string } };
type Buyers = { buyers: { id: number; code: string; name: string }[] };

const previousMonth = (day: string) => {
  const [y, m] = day.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

export default function IncentivesPage() {
  const { me, can } = useMe();
  const [period, setPeriod] = useState('');
  const current = period || (me ? previousMonth(me.businessDay) : '');
  const { data, loading, error, reload } = useApi<{ results: Result[]; payments: Payment[] }>(current ? `/api/incentives?period=${current}` : null);
  const buyers = useApi<Buyers>('/api/masters');
  const calc = useAction();
  const pay = useAction();
  const [form, setForm] = useState({ party_id: '', paid_amount: '', paid_on: '' });
  const total = data?.results.reduce((s, r) => s + Number(r.incentive_amount), 0) ?? 0;

  const runCalc = async () => {
    if (await calc.run(() => apiSend('/api/incentives', { period: current }), `${current} の計算を実行しました`)) reload();
  };
  const addPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (await pay.run(() => apiSend('/api/payments', { ...form, party_id: Number(form.party_id), paid_amount: Number(form.paid_amount), period: current }), '入金を登録しました')) reload();
  };

  return (
    <>
      <PageHeader title="完納奨励金" description="支払期日（当日を含む）までに請求額を完納した参加者に、適格金額×交付率×110/100（JPY切捨て）を算出。期日超過・一部入金は0円。" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="対象期（月）"><Input type="month" value={current} onChange={(e) => setPeriod(e.target.value)} /></Field>
        {can('incentive.run') && <Button disabled={calc.busy || !current} onClick={runCalc}>計算を実行</Button>}
        <p className="text-sm text-slate-600">確定済みの期を再計算すると、元の結果は変えずに次期の差分として記録します。</p>
      </div>
      <Message message={calc.message} />
      <LoadState loading={loading} error={error} />
      <Card title={`計算結果（合計 ${yen(total)}）`} className="my-4">
        <Table head={['区分', '参加者', '適格金額（税抜）', '請求額（税込8%）', '期日内入金', '支払期日', '最終入金日', '完納', '料率版', '奨励金']}>
          {data?.results.map((r) => (
            <tr key={r.id}>
              <Td>{r.kind === '次期差分' ? <span title={r.cause ?? ''}><Badge>次期差分</Badge> <span className="text-xs">（{r.source_period}分）</span></span> : '本計算'}</Td>
              <Td>{r.parties.code} {r.parties.name}</Td><Td className="text-right">{yen(r.eligible_amount)}</Td><Td className="text-right">{yen(r.billed_amount)}</Td>
              <Td className="text-right">{yen(r.paid_amount)}</Td><Td>{r.due_date}</Td><Td>{r.last_paid_on ?? '—'}</Td>
              <Td>{r.on_time ? <Badge>完了</Badge> : <Badge>期限切れ</Badge>}</Td>
              <Td>v{r.rate_versions.version_no}（{(r.rate_versions.rate_bp / 100).toFixed(2)}%）</Td>
              <Td className="text-right font-bold">{yen(r.incentive_amount)}</Td>
            </tr>
          ))}
        </Table>
        {data?.results.length === 0 && <p className="mt-2 text-sm text-slate-500">この期はまだ計算していません。</p>}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`入金実績（${current}分）`}>
          <Table head={['参加者', '入金額', '入金日']}>
            {data?.payments.map((p) => <tr key={p.id}><Td>{p.parties.code} {p.parties.name}</Td><Td className="text-right">{yen(p.paid_amount)}</Td><Td>{p.paid_on}</Td></tr>)}
          </Table>
        </Card>
        {can('payment.write') && (
          <Card title="入金の登録（モック: 本来は会計システムの入金CSV取込）">
            <form onSubmit={addPayment} className="space-y-2">
              <Field label="参加者">
                <Select required value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })}>
                  <option value="">選択</option>
                  {buyers.data?.buyers.map((b) => <option key={b.id} value={b.id}>{b.code} {b.name}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="入金額（円）"><Input required type="number" min="1" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></Field>
                <Field label="入金日"><Input required type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} /></Field>
              </div>
              <Button disabled={pay.busy}>登録</Button>
              <Message message={pay.message} />
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
