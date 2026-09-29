'use client';
// ロット詳細（SCR-032）と目利き・下見結果入力（SCR-033）
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, LoadState, Message, PageHeader, Table, Td, dateTime, num, yen } from '@/components/ui-primitives';

type Detail = {
  lot: { id: number; lot_code: string; business_day: string; initial_qty: number; available_qty: number; status: string; judge_result: string | null; judged_at: string | null;
    items: { name: string; unit: string }; shippers: { name: string }; judge: { display_name: string } | null };
  trades: { id: number; trade_code: string; trade_type: string; qty: number; unit_price: number; amount: number; status: string; entry_kind: string; delivery_status: string; parties: { code: string; name: string } }[];
};
const GRADES = ['特選', '上', '並', '規格外'];

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useMe();
  const { data, loading, error, reload } = useApi<Detail>(`/api/lots/${id}`);
  const [grade, setGrade] = useState('');
  const { busy, message, run } = useAction();
  const act = async (body: object, ok: string) => { if (await run(() => apiSend(`/api/lots/${id}`, body), ok)) reload(); };
  const lot = data?.lot;

  return (
    <>
      <PageHeader title={lot ? `ロット ${lot.lot_code}` : 'ロット詳細'} actions={<Link href="/lots" className="text-sm text-sky-700">← ロット一覧</Link>} />
      <LoadState loading={loading} error={error} />
      {lot && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="ロット情報">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500">状態</dt><dd><Badge>{lot.status}</Badge></dd>
              <dt className="text-slate-500">業務日</dt><dd>{lot.business_day}</dd>
              <dt className="text-slate-500">品目</dt><dd>{lot.items.name}</dd>
              <dt className="text-slate-500">荷主</dt><dd>{lot.shippers.name}</dd>
              <dt className="text-slate-500">初期数量</dt><dd>{num(lot.initial_qty)} {lot.items.unit}</dd>
              <dt className="text-slate-500">利用可能数量</dt><dd className="font-bold">{num(lot.available_qty)} {lot.items.unit}</dd>
            </dl>
          </Card>
          <Card title="目利き・下見（人が判定）">
            <p className="text-sm">結果: <span className="font-bold">{lot.judge_result ?? '未記録'}</span></p>
            {lot.judge && <p className="text-xs text-slate-500">記録者 {lot.judge.display_name}／{dateTime(lot.judged_at)}</p>}
            {can('lot.judge') && ['受付', '下見済'].includes(lot.status) && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {GRADES.map((g) => (
                    <button key={g} onClick={() => setGrade(g)} className={`rounded border px-4 py-3 text-base ${grade === g ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-300 bg-white'}`}>{g}</button>
                  ))}
                </div>
                <Button disabled={!grade || busy} onClick={() => act({ action: 'judge', judge_result: grade }, '評価結果を記録しました')}>評価結果を記録</Button>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">鮮度・品質の自動判定は行いません（SCOPE-OUT-01）。</p>
          </Card>
          <Card title="販売">
            {lot.status === '下見済' && can('lot.write')
              ? <Button disabled={busy} onClick={() => act({ action: 'publish' }, '販売を公開しました')}>販売を公開（相対・せりの対象にする）</Button>
              : <p className="text-sm text-slate-600">{lot.status === '受付' ? '評価の記録後に公開できます' : `現在の状態: ${lot.status}`}</p>}
            {['公開', '売買確定'].includes(lot.status) && can('trade.write') && Number(lot.available_qty) > 0 && (
              <Link href={`/trades/new?lot=${lot.id}`} className="mt-3 inline-block text-sm text-sky-700 hover:underline">このロットで相対取引を入力 →</Link>
            )}
          </Card>
          <div className="lg:col-span-3"><Message message={message} /></div>
          <Card title="このロットの取引" className="lg:col-span-3">
            <Table head={['取引コード', '種別', '区分', '買手', '数量', '単価', '金額', '状態', '引渡し']}>
              {data.trades.map((t) => (
                <tr key={t.id}>
                  <Td><Link href={`/trades/${t.id}`} className="text-sky-700 hover:underline">{t.trade_code}</Link></Td>
                  <Td><Badge>{t.trade_type}</Badge></Td><Td>{t.entry_kind === '通常' ? '' : <Badge>{t.entry_kind}</Badge>}</Td>
                  <Td>{t.parties.code} {t.parties.name}</Td><Td className="text-right">{num(t.qty)}</Td>
                  <Td className="text-right">{yen(t.unit_price)}</Td><Td className="text-right">{yen(t.amount)}</Td>
                  <Td><Badge>{t.status}</Badge></Td><Td><Badge>{t.delivery_status}</Badge></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
