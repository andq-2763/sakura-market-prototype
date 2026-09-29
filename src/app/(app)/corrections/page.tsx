'use client';
// 修正依頼一覧（SCR-080）と審査（SCR-082）。承認で赤黒レコードを生成し、元の取引は変更しない
import Link from 'next/link';
import { useState } from 'react';
import { useMe } from '@/components/app-shell';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, Input, LoadState, Message, PageHeader, Select, Table, Td, dateTime, num, yen } from '@/components/ui-primitives';

type Correction = { id: number; correction_code: string; new_qty: number; new_unit_price: number; reason: string; evidence_note: string | null; status: string;
  requested_by: string; requested_at: string; reviewed_at: string | null; review_comment: string | null;
  trades: { id: number; trade_code: string; business_day: string; qty: number; unit_price: number; amount: number; parties: { code: string; name: string } };
  requester: { display_name: string } | null; reviewer: { display_name: string } | null };

function ReviewForm({ c, onDone }: { c: Correction; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const { busy, message, run } = useAction();
  const decide = async (decision: string) => {
    if (await run(() => apiSend(`/api/corrections/${c.id}`, { decision, comment }), `${decision}しました`)) onDone();
  };
  return (
    <div className="mt-2 space-y-2">
      <Input placeholder="コメント（却下・追加情報要求は必須）" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => decide('承認')}>承認（赤黒を生成）</Button>
        <Button variant="secondary" disabled={busy} onClick={() => decide('追加情報要求')}>追加情報要求</Button>
        <Button variant="danger" disabled={busy} onClick={() => decide('却下')}>却下</Button>
      </div>
      <Message message={message} />
    </div>
  );
}

export default function CorrectionsPage() {
  const { can, me } = useMe();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi<Correction[]>(`/api/corrections${status ? `?status=${status}` : ''}`);

  return (
    <>
      <PageHeader title="確定後修正（赤黒）" description="修正依頼は取引詳細画面から起票します。承認すると当日の業務日に赤（取消）と黒（訂正）の取引を追加し、ロック済みの元データは変わりません。" />
      <div className="mb-3 flex items-center gap-2 text-sm">
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="状態">
          <option value="">状態: すべて</option><option>承認待ち</option><option>承認</option><option>追加情報要求</option><option>却下</option>
        </Select>
      </div>
      <LoadState loading={loading} error={error} />
      <div className="space-y-3">
        {data?.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{c.correction_code} <Badge>{c.status}</Badge></p>
              <p className="text-xs text-slate-500">起票 {c.requester?.display_name}／{dateTime(c.requested_at)}</p>
            </div>
            <Table head={['対象取引', '業務日', '買手', '数量', '単価', '金額']}>
              <tr>
                <Td><Link href={`/trades/${c.trades.id}`} className="text-sky-700">{c.trades.trade_code}</Link></Td><Td>{c.trades.business_day}</Td>
                <Td>{c.trades.parties.code} {c.trades.parties.name}</Td>
                <Td>{num(c.trades.qty)} → <b>{num(c.new_qty)}</b></Td><Td>{yen(c.trades.unit_price)} → <b>{yen(c.new_unit_price)}</b></Td>
                <Td>{yen(c.trades.amount)} → <b>{yen(Math.floor(Number(c.new_qty) * c.new_unit_price))}</b></Td>
              </tr>
            </Table>
            <p className="mt-2 text-sm">理由: {c.reason}{c.evidence_note && <span className="text-slate-500">（証拠: {c.evidence_note}）</span>}</p>
            {c.reviewer && <p className="text-sm text-slate-600">審査 {c.reviewer.display_name}／{dateTime(c.reviewed_at)} {c.review_comment && `「${c.review_comment}」`}</p>}
            {c.status === '承認待ち' && can('correction.approve') && (
              c.requested_by === me?.user.id
                ? <p className="mt-2 text-xs text-amber-800">起票者本人は審査できません（職務分離）。</p>
                : <ReviewForm c={c} onDone={reload} />
            )}
          </Card>
        ))}
        {data?.length === 0 && <p className="text-sm text-slate-500">該当する修正依頼はありません。</p>}
      </div>
    </>
  );
}
