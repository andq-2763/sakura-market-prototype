'use client';
// 相対取引 入力・確定（SCR-040）。キーボードのみ（Tab/Enter）で連続入力できる
// 確定時に参加資格と利用可能数量をサーバ（DB関数）で判定し、拒否なら取引を作らない
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState, type FormEvent } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Field, Input, LoadState, Message, PageHeader, Select, Table, Td, num, yen } from '@/components/ui-primitives';

type Masters = {
  lotsForSale: { id: number; lot_code: string; available_qty: number; items: { name: string; unit: string } }[];
  buyers: { id: number; code: string; name: string; party_type: string; qualification: { basis: string; status: string; validTo: string | null } }[];
};
type Trade = { id: number; trade_code: string; qty: number; unit_price: number; amount: number; status: string; lots: { lot_code: string }; parties: { code: string; name: string } };

function TradeEntry() {
  const { can } = useMe();
  const initialLot = useSearchParams().get('lot') ?? '';
  const masters = useApi<Masters>('/api/masters');
  const recent = useApi<{ trades: Trade[] }>('/api/trades?trade_type=相対');
  const [form, setForm] = useState({ lot_id: initialLot, buyer_party_id: '', qty: '', unit_price: '' });
  const { busy, message, run } = useAction();
  const lotRef = useRef<HTMLSelectElement>(null);
  const lot = masters.data?.lotsForSale.find((l) => String(l.id) === form.lot_id);
  const buyer = masters.data?.buyers.find((b) => String(b.id) === form.buyer_party_id);

  async function save(confirm: boolean) {
    const ok = await run(async () => {
      const t = await apiSend<{ trade_code: string; status: string }>('/api/trades', {
        trade_type: '相対', lot_id: Number(form.lot_id), buyer_party_id: Number(form.buyer_party_id),
        qty: Number(form.qty), unit_price: Number(form.unit_price), confirm,
      });
      return t;
    }, confirm ? '取引を確定しました' : '下書きを保存しました');
    if (ok) {
      setForm({ ...form, qty: '', unit_price: '' });
      masters.reload(); recent.reload();
      lotRef.current?.focus();
    }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); save(true); };

  if (!can('trade.write')) return <Message message={{ kind: 'error', text: 'この画面を使う権限がありません（取引担当・システム管理者）' }} />;
  return (
    <>
      <Card title="相対取引（売り手と買手の直接合意）" className="mb-4">
        <LoadState loading={masters.loading} error={masters.error} />
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-5 md:items-end">
          <Field label="ロット" hint={lot ? `利用可能 ${num(lot.available_qty)} ${lot.items.unit}` : '公開中のロット'}>
            <Select ref={lotRef} required autoFocus value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })}>
              <option value="">選択</option>
              {masters.data?.lotsForSale.map((l) => <option key={l.id} value={l.id}>{l.lot_code} {l.items.name}</option>)}
            </Select>
          </Field>
          <Field label="買手" hint={buyer ? `${buyer.qualification.basis}: ${buyer.qualification.status}${buyer.qualification.validTo ? `（〜${buyer.qualification.validTo}）` : ''}` : '仲卸=許可／売買参加者=承認'}>
            <Select required value={form.buyer_party_id} onChange={(e) => setForm({ ...form, buyer_party_id: e.target.value })}>
              <option value="">選択</option>
              {masters.data?.buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.code} {b.name}（{b.party_type}・{b.qualification.status}）</option>
              ))}
            </Select>
          </Field>
          <Field label={`数量${lot ? `（${lot.items.unit}）` : ''}`}>
            <Input required type="number" min="0.1" step="0.1" inputMode="decimal" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </Field>
          <Field label="単価（円）" hint={form.qty && form.unit_price ? `金額 ${yen(Math.floor(Number(form.qty) * Number(form.unit_price)))}` : undefined}>
            <Input required type="number" min="0" step="1" inputMode="numeric" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="py-2">確定（Enter）</Button>
            <Button type="button" variant="secondary" disabled={busy} className="py-2" onClick={() => save(false)}>下書き</Button>
          </div>
        </form>
        <div className="mt-3"><Message message={message} /></div>
      </Card>
      <Card title="当日の相対取引">
        <LoadState loading={recent.loading} error={recent.error} />
        <Table head={['取引コード', 'ロット', '買手', '数量', '単価', '金額', '状態']}>
          {recent.data?.trades.map((t) => (
            <tr key={t.id}>
              <Td><Link href={`/trades/${t.id}`} className="text-sky-700 hover:underline">{t.trade_code}</Link></Td>
              <Td>{t.lots.lot_code}</Td><Td>{t.parties.code} {t.parties.name}</Td><Td className="text-right">{num(t.qty)}</Td>
              <Td className="text-right">{yen(t.unit_price)}</Td><Td className="text-right">{yen(t.amount)}</Td><Td><Badge>{t.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

export default function NewTradePage() {
  return (
    <>
      <PageHeader title="相対取引 入力" description="Tab で項目移動、Enter で確定。失効・一時停止の参加者や数量超過は確定時に拒否され、取引は作成されません。" />
      <Suspense><TradeEntry /></Suspense>
    </>
  );
}
