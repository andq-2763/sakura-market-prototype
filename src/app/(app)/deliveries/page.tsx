'use client';
// 引渡しボード（SCR-060）: 状態別の未完了引渡しと滞留。記録は取引詳細の引渡しフォームで行う
import Link from 'next/link';
import { useState } from 'react';
import { useMe } from '@/components/app-shell';
import { useApi } from '@/components/use-api';
import { Badge, Card, LoadState, PageHeader, Table, Td, num } from '@/components/ui-primitives';

type Row = { id: number; trade_code: string; trade_type: string; business_day: string; delivery_status: string; target: number; delivered: number; remaining: number;
  lots: { lot_code: string; items: { name: string; unit: string } }; parties: { code: string; name: string }; deliveries: { exception_type: string | null }[] };

const COLUMNS = ['待機中', '引渡し中', '例外'];

export default function DeliveriesPage() {
  const { me } = useMe();
  const [includeDone, setIncludeDone] = useState(false);
  const { data, loading, error } = useApi<Row[]>(`/api/deliveries${includeDone ? '?include_done=1' : ''}`);
  const statuses = includeDone ? [...COLUMNS, '完了'] : COLUMNS;

  return (
    <>
      <PageHeader title="引渡し管理" description="確認数量が取引数量と一致したときだけ完了になります（BR-DEL-03）。分割引渡しは累積と残数量で管理します。" />
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={includeDone} onChange={(e) => setIncludeDone(e.target.checked)} /> 完了した引渡しも表示
      </label>
      <LoadState loading={loading} error={error} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {COLUMNS.map((s) => (
          <Card key={s}><p className="text-xs text-slate-500">{s}</p><p className="text-2xl font-bold">{data?.filter((r) => r.delivery_status === s).length ?? 0}</p></Card>
        ))}
      </div>
      {statuses.map((s) => {
        const rows = data?.filter((r) => r.delivery_status === s) ?? [];
        if (!rows.length) return null;
        return (
          <Card key={s} title={`${s}（${rows.length}件）`} className="mb-4">
            <Table head={['取引コード', '業務日', 'ロット・品目', '買手', '取引数量', '引渡済', '残数量', '']}>
              {rows.map((r) => (
                <tr key={r.id} className={me && r.business_day < me.businessDay && s !== '完了' ? 'bg-amber-50' : ''}>
                  <Td><Link href={`/trades/${r.id}`} className="font-medium text-sky-700 hover:underline">{r.trade_code}</Link></Td>
                  <Td>{r.business_day}</Td><Td>{r.lots.lot_code} {r.lots.items.name}</Td><Td>{r.parties.code} {r.parties.name}</Td>
                  <Td className="text-right">{num(r.target)} {r.lots.items.unit}</Td><Td className="text-right">{num(r.delivered)}</Td>
                  <Td className="text-right font-bold">{num(r.remaining)}</Td>
                  <Td>{r.deliveries.some((d) => d.exception_type) && <Badge>例外</Badge>} <Link href={`/trades/${r.id}`} className="text-xs text-sky-700">記録する →</Link></Td>
                </tr>
              ))}
            </Table>
          </Card>
        );
      })}
      <p className="text-xs text-slate-500">黄色の行は前の業務日から滞留している引渡しです。</p>
    </>
  );
}
