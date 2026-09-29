'use client';
// せり結果 記録（SCR-051）と確認・承認（SCR-052）
// システムはせりを進行しない。運営者が確認した最終結果（落札者・数量・単価・時刻）だけを入力し、別の担当者が確定する
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Button, Card, Field, Input, LoadState, Message, PageHeader, Select, Table, Td, num, yen } from '@/components/ui-primitives';

type Masters = { lotsForSale: { id: number; lot_code: string; available_qty: number; items: { name: string; unit: string } }[];
  buyers: { id: number; code: string; name: string; qualification: { status: string } }[] };
type Trade = { id: number; trade_code: string; qty: number; unit_price: number; amount: number; seri_time: string | null; status: string;
  lots: { lot_code: string; items: { name: string; unit: string } }; parties: { code: string; name: string } };

export default function SeriPage() {
  const { can } = useMe();
  const masters = useApi<Masters>('/api/masters');
  const queue = useApi<{ trades: Trade[] }>('/api/trades?trade_type=せり');
  const [form, setForm] = useState({ lot_id: '', buyer_party_id: '', qty: '', unit_price: '', seri_time: '' });
  const entry = useAction();
  const approve = useAction();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await entry.run(() => apiSend('/api/trades', { trade_type: 'せり', ...form, lot_id: Number(form.lot_id), buyer_party_id: Number(form.buyer_party_id),
      qty: Number(form.qty), unit_price: Number(form.unit_price) }), 'せり結果を登録しました（確認待ち）');
    if (ok) { setForm({ ...form, qty: '', unit_price: '', seri_time: '' }); queue.reload(); }
  }
  const confirm = async (id: number) => {
    if (await approve.run(() => apiSend(`/api/trades/${id}`, { action: 'confirm' }), 'せり結果を確定しました')) { queue.reload(); masters.reload(); }
  };
  const waiting = queue.data?.trades.filter((t) => t.status === '確認待ち') ?? [];
  const done = queue.data?.trades.filter((t) => t.status !== '確認待ち') ?? [];

  return (
    <>
      <PageHeader title="せり結果 記録" description="手やり・符丁の解釈は人が行います。画像・記号の自動読み取りは行いません（SCOPE-OUT-02）。" />
      {can('seri.write') && (
        <Card title="最終結果の入力" className="mb-4">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-6 md:items-end">
            <Field label="ロット">
              <Select required value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })}>
                <option value="">選択</option>
                {masters.data?.lotsForSale.map((l) => <option key={l.id} value={l.id}>{l.lot_code} {l.items.name}（残 {num(l.available_qty)}）</option>)}
              </Select>
            </Field>
            <Field label="落札者">
              <Select required value={form.buyer_party_id} onChange={(e) => setForm({ ...form, buyer_party_id: e.target.value })}>
                <option value="">選択</option>
                {masters.data?.buyers.map((b) => <option key={b.id} value={b.id}>{b.code} {b.name}（{b.qualification.status}）</option>)}
              </Select>
            </Field>
            <Field label="数量"><Input required type="number" min="0.1" step="0.1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="単価（円）"><Input required type="number" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></Field>
            <Field label="結果時刻"><Input required type="time" value={form.seri_time} onChange={(e) => setForm({ ...form, seri_time: e.target.value })} /></Field>
            <Button disabled={entry.busy} className="py-2">登録（確認待ち）</Button>
          </form>
          <div className="mt-3"><Message message={entry.message} /></div>
        </Card>
      )}
      <Card title={`確認待ち（${waiting.length}件）— 入力者とは別の担当者が確定します`} className="mb-4">
        <LoadState loading={queue.loading} error={queue.error} />
        <Message message={approve.message} />
        <Table head={['取引コード', 'ロット', '落札者', '数量', '単価', '金額', '時刻', '']}>
          {waiting.map((t) => (
            <tr key={t.id}>
              <Td><Link href={`/trades/${t.id}`} className="text-sky-700">{t.trade_code}</Link></Td><Td>{t.lots.lot_code} {t.lots.items.name}</Td>
              <Td>{t.parties.code} {t.parties.name}</Td><Td>{num(t.qty)}</Td><Td>{yen(t.unit_price)}</Td><Td>{yen(t.amount)}</Td><Td>{t.seri_time?.slice(0, 5)}</Td>
              <Td>{can('seri.approve') && <Button disabled={approve.busy} onClick={() => confirm(t.id)}>確認して確定</Button>}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="当日のせり結果">
        <Table head={['取引コード', 'ロット', '落札者', '数量', '金額', '状態']}>
          {done.map((t) => (
            <tr key={t.id}><Td><Link href={`/trades/${t.id}`} className="text-sky-700">{t.trade_code}</Link></Td><Td>{t.lots.lot_code}</Td>
              <Td>{t.parties.code} {t.parties.name}</Td><Td>{num(t.qty)}</Td><Td>{yen(t.amount)}</Td><Td>{t.status}</Td></tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
