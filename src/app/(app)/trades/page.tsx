'use client';
// 取引一覧（SCR-041）: 相対・せり共通。業務日・種別・状態で絞り込み
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useApi } from '@/components/use-api';
import { Badge, Card, Input, LoadState, PageHeader, Select, Table, Td, dateTime, num, yen } from '@/components/ui-primitives';

type Trade = { id: number; trade_code: string; trade_type: string; qty: number; unit_price: number; amount: number; status: string; delivery_status: string; entry_kind: string; created_at: string;
  lots: { lot_code: string; items: { name: string; unit: string } }; parties: { code: string; name: string; party_type: string } };

function TradeList() {
  const params = useSearchParams();
  const [day, setDay] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const qs = new URLSearchParams(Object.entries({ day, trade_type: type, status }).filter(([, v]) => v));
  const { data, loading, error } = useApi<{ day: string; trades: Trade[] }>(`/api/trades?${qs}`);
  const total = data?.trades.filter((t) => t.status === '確定').reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Input type="date" className="w-44" value={day || data?.day || ''} onChange={(e) => setDay(e.target.value)} aria-label="業務日" />
        <Select className="w-32" value={type} onChange={(e) => setType(e.target.value)} aria-label="取引種別">
          <option value="">種別: すべて</option><option>相対</option><option>せり</option>
        </Select>
        <Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="状態">
          <option value="">状態: すべて</option><option>下書き</option><option>確認待ち</option><option>確定</option><option>取消</option>
        </Select>
        <span className="text-slate-600">{data?.trades.length ?? 0} 件／確定合計 {yen(total)}</span>
      </div>
      <LoadState loading={loading} error={error} />
      <Table head={['取引コード', '種別', '区分', 'ロット・品目', '買手', '数量', '単価', '金額', '状態', '引渡し', '登録']}>
        {data?.trades.map((t) => (
          <tr key={t.id}>
            <Td><Link href={`/trades/${t.id}`} className="font-medium text-sky-700 hover:underline">{t.trade_code}</Link></Td>
            <Td><Badge>{t.trade_type}</Badge></Td><Td>{t.entry_kind === '通常' ? '' : <Badge>{t.entry_kind}</Badge>}</Td>
            <Td>{t.lots.lot_code} {t.lots.items.name}</Td><Td>{t.parties.code} {t.parties.name}</Td>
            <Td className="text-right">{num(t.qty)} {t.lots.items.unit}</Td><Td className="text-right">{yen(t.unit_price)}</Td>
            <Td className="text-right">{yen(t.amount)}</Td><Td><Badge>{t.status}</Badge></Td><Td><Badge>{t.delivery_status}</Badge></Td>
            <Td>{dateTime(t.created_at)}</Td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

export default function TradesPage() {
  return (
    <>
      <PageHeader title="取引一覧" description="赤＝取消レコード、黒＝訂正レコード（確定後修正の承認で生成）" actions={<Link href="/trades/new" className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white">相対取引を入力</Link>} />
      <Suspense><TradeList /></Suspense>
    </>
  );
}
