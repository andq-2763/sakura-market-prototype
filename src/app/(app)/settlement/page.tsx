'use client';
// 日次照合表（SCR-070）と業務日締め（SCR-072）。ロック後は直接修正できず、修正依頼（赤黒）だけが残る
import Link from 'next/link';
import { useState } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Input, LoadState, Message, PageHeader, Table, Td, dateTime, num, yen } from '@/components/ui-primitives';

type Row = { id: number; trade_code: string; trade_type: string; status: string; entry_kind: string; qty: number; unit_price: number; amount: number; delivery_status: string;
  delivered: number; flag: string; lots: { lot_code: string; items: { name: string; unit: string } }; parties: { code: string; name: string } };
type Data = { day: string; today: string; rows: Row[]; recentDays: { day: string; locked: boolean }[];
  dayInfo: { locked: boolean; locked_at: string | null; locker: { display_name: string } | null } | null;
  summary: { 相対: { count: number; amount: number }; せり: { count: number; amount: number }; adjustments: number; unconfirmed: number; deliveryIssues: number; total: number } };

export default function SettlementPage() {
  const { can } = useMe();
  const [day, setDay] = useState('');
  const { data, loading, error, reload } = useApi<Data>(`/api/settlement${day ? `?day=${day}` : ''}`);
  const { busy, message, run } = useAction();
  const locked = Boolean(data?.dayInfo?.locked);

  const lock = async () => {
    if (!data || !window.confirm(`業務日 ${data.day} をロックします。以後この日の取引は直接修正できません。よろしいですか？`)) return;
    if (await run(() => apiSend('/api/settlement', { day: data.day }), `業務日 ${data.day} をロックしました`)) reload();
  };

  return (
    <>
      <PageHeader title="日次照合・締め" description="業務日単位で取引・引渡し・例外を集約します。ロック後の誤りは「確定後修正」から赤黒で直します。" />
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Input type="date" className="w-44" value={day || data?.day || ''} onChange={(e) => setDay(e.target.value)} aria-label="業務日" />
        {data?.recentDays.map((d) => (
          <button key={d.day} onClick={() => setDay(d.day)} className={`rounded border px-2 py-1 text-xs ${d.day === data.day ? 'border-sky-700 bg-sky-50' : 'border-slate-300 bg-white'}`}>
            {d.day.slice(5)} {d.locked ? '🔒' : ''}
          </button>
        ))}
      </div>
      <LoadState loading={loading} error={error} />
      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card><p className="text-xs text-slate-500">確定金額合計</p><p className="text-xl font-bold">{yen(data.summary.total)}</p></Card>
            <Card><p className="text-xs text-slate-500">相対</p><p className="text-lg font-bold">{data.summary.相対.count}件</p><p className="text-xs">{yen(data.summary.相対.amount)}</p></Card>
            <Card><p className="text-xs text-slate-500">せり</p><p className="text-lg font-bold">{data.summary.せり.count}件</p><p className="text-xs">{yen(data.summary.せり.amount)}</p></Card>
            <Card><p className="text-xs text-slate-500">未確定／赤黒調整</p><p className="text-lg font-bold">{data.summary.unconfirmed}件／{data.summary.adjustments}件</p></Card>
            <Card><p className="text-xs text-slate-500">引渡し未完了・例外</p><p className="text-lg font-bold">{data.summary.deliveryIssues}件</p></Card>
          </div>
          <Card title="締め" className="mb-4">
            {locked ? (
              <p className="text-sm"><Badge>ロック済</Badge> {data.dayInfo?.locker?.display_name}／{dateTime(data.dayInfo?.locked_at)}。直接修正はDBで遮断されます。</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm">未ロック。未確定の取引（下書き・確認待ち）が残っているとロックできません。</p>
                {can('settle.lock') && <Button variant="danger" disabled={busy} onClick={lock}>この業務日をロック</Button>}
              </div>
            )}
            <div className="mt-2"><Message message={message} /></div>
          </Card>
          <Card title={`照合明細（${data.rows.length}件）`}>
            <Table head={['取引コード', '種別', '区分', 'ロット・品目', '買手', '数量', '単価', '金額', '状態', '引渡済', '照合']}>
              {data.rows.map((r) => (
                <tr key={r.id} className={r.flag && r.flag !== '調整' ? 'bg-amber-50' : ''}>
                  <Td><Link href={`/trades/${r.id}`} className="text-sky-700 hover:underline">{r.trade_code}</Link></Td>
                  <Td><Badge>{r.trade_type}</Badge></Td><Td>{r.entry_kind === '通常' ? '' : <Badge>{r.entry_kind}</Badge>}</Td>
                  <Td>{r.lots.lot_code} {r.lots.items.name}</Td><Td>{r.parties.code} {r.parties.name}</Td>
                  <Td className="text-right">{num(r.qty)}</Td><Td className="text-right">{yen(r.unit_price)}</Td><Td className="text-right">{yen(r.amount)}</Td>
                  <Td><Badge>{r.status}</Badge></Td><Td className="text-right">{r.entry_kind === '通常' ? num(r.delivered) : '—'}</Td><Td className="text-xs text-amber-800">{r.flag}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
