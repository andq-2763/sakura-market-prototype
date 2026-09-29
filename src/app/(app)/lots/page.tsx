'use client';
// ロット受付登録（SCR-030）とロット一覧（SCR-031）
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Select, Table, Td, dateTime, num } from '@/components/ui-primitives';

type Lot = { id: number; lot_code: string; initial_qty: number; available_qty: number; status: string; judge_result: string | null; created_at: string; items: { name: string; unit: string }; shippers: { name: string } };
type Masters = { businessDay: string; items: { id: number; name: string; unit: string }[]; shippers: { id: number; name: string }[] };

export default function LotsPage() {
  const { can } = useMe();
  const [day, setDay] = useState('');
  const lots = useApi<{ day: string; lots: Lot[] }>(`/api/lots${day ? `?day=${day}` : ''}`);
  const masters = useApi<Masters>('/api/masters');
  const [form, setForm] = useState({ shipper_id: '', item_id: '', initial_qty: '' });
  const { busy, message, run } = useAction();
  const unit = masters.data?.items.find((i) => String(i.id) === form.item_id)?.unit ?? '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(async () => {
      const lot = await apiSend<{ lot_code: string }>('/api/lots', { shipper_id: Number(form.shipper_id), item_id: Number(form.item_id), initial_qty: Number(form.initial_qty) });
      return lot;
    }, 'ロットを登録しました');
    if (ok) { setForm({ ...form, initial_qty: '' }); lots.reload(); }
  }

  return (
    <>
      <PageHeader title="ロット受付・評価" description="入荷ロットの受付登録。目利き・下見の結果は人が判定し、システムは結果を記録するだけです。" />
      {can('lot.write') && (
        <Card title="ロット受付登録（当日の業務日で採番）" className="mb-4">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4 sm:items-end">
            <Field label="荷主・船">
              <Select required value={form.shipper_id} onChange={(e) => setForm({ ...form, shipper_id: e.target.value })}>
                <option value="">選択</option>
                {masters.data?.shippers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="品目">
              <Select required value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
                <option value="">選択</option>
                {masters.data?.items.map((i) => <option key={i.id} value={i.id}>{i.name}（{i.unit}）</option>)}
              </Select>
            </Field>
            <Field label={`初期数量${unit ? `（${unit}）` : ''}`}>
              <Input required type="number" min="0.1" step="0.1" inputMode="decimal" value={form.initial_qty} onChange={(e) => setForm({ ...form, initial_qty: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy} className="py-2">登録</Button>
          </form>
          <div className="mt-3"><Message message={message} /></div>
        </Card>
      )}
      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span>業務日</span>
          <Input type="date" className="w-44" value={day || lots.data?.day || ''} onChange={(e) => setDay(e.target.value)} />
          <span className="text-slate-500">{lots.data?.lots.length ?? 0} 件</span>
        </div>
        <LoadState loading={lots.loading} error={lots.error} />
        <Table head={['ロットコード', '品目', '荷主', '初期数量', '利用可能数量', '評価', '状態', '受付時刻']}>
          {lots.data?.lots.map((l) => (
            <tr key={l.id}>
              <Td><Link href={`/lots/${l.id}`} className="font-medium text-sky-700 hover:underline">{l.lot_code}</Link></Td>
              <Td>{l.items.name}</Td><Td>{l.shippers.name}</Td>
              <Td className="text-right">{num(l.initial_qty)} {l.items.unit}</Td>
              <Td className="text-right">{num(l.available_qty)} {l.items.unit}</Td>
              <Td>{l.judge_result ?? '—'}</Td><Td><Badge>{l.status}</Badge></Td><Td>{dateTime(l.created_at)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
