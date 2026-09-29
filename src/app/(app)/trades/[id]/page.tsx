'use client';
// 取引詳細（SCR-042）: 状態、引渡し、修正依頼、赤黒レコード、監査履歴と各操作
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMe } from '@/components/app-shell';
import { CancelTradeForm, CorrectionRequestForm, DeliveryForm } from '@/components/trade-action-forms';
import { apiSend, useAction, useApi } from '@/components/use-api';
import { Badge, Button, Card, LoadState, Message, PageHeader, Table, Td, dateTime, num, yen } from '@/components/ui-primitives';

type Detail = {
  trade: { id: number; trade_code: string; trade_type: string; business_day: string; qty: number; unit_price: number; amount: number; status: string; entry_kind: string;
    delivery_status: string; seri_time: string | null; cancel_reason: string | null; confirmed_at: string | null;
    lots: { id: number; lot_code: string; items: { name: string; unit: string } }; parties: { id: number; code: string; name: string; party_type: string };
    creator: { display_name: string } | null; confirmer: { display_name: string } | null };
  deliveries: { id: number; seq: number; qty: number; exception_type: string | null; reason: string | null; recorded_at: string; recorder: { display_name: string } | null }[];
  corrections: { id: number; correction_code: string; new_qty: number; new_unit_price: number; status: string; reason: string }[];
  adjustments: { id: number; trade_code: string; entry_kind: string; business_day: string; qty: number; unit_price: number; amount: number }[];
  history: { id: number; at: string; actor_email: string; action: string; reason: string | null }[];
  dayLocked: boolean;
};

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useMe();
  const { data, loading, error, reload } = useApi<Detail>(`/api/trades/${id}`);
  const { busy, message, run } = useAction();
  const t = data?.trade;
  const black = data?.adjustments.filter((a) => a.entry_kind === '黒').at(-1);
  const target = Number(black?.qty ?? t?.qty ?? 0);
  const delivered = data?.deliveries.reduce((s, d) => s + Number(d.qty), 0) ?? 0;
  const canConfirm = t && ((t.trade_type === '相対' && t.status === '下書き' && can('trade.write')) || (t.trade_type === 'せり' && t.status === '確認待ち' && can('seri.approve')));
  const isNormalConfirmed = t?.status === '確定' && t.entry_kind === '通常';
  const hasPendingCorrection = data?.corrections.some((c) => c.status === '承認待ち' || c.status === '承認');

  return (
    <>
      <PageHeader title={t ? `取引 ${t.trade_code}` : '取引詳細'} actions={<Link href="/trades" className="text-sm text-sky-700">← 取引一覧</Link>} />
      <LoadState loading={loading} error={error} />
      {t && data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="取引情報" className="lg:col-span-2">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
              <dt className="text-slate-500">種別</dt><dd><Badge>{t.trade_type}</Badge> {t.entry_kind !== '通常' && <Badge>{t.entry_kind}</Badge>}</dd>
              <dt className="text-slate-500">状態</dt><dd><Badge>{t.status}</Badge> {data.dayLocked && <Badge>ロック済</Badge>}</dd>
              <dt className="text-slate-500">業務日</dt><dd>{t.business_day}</dd>
              <dt className="text-slate-500">ロット</dt><dd><Link className="text-sky-700" href={`/lots/${t.lots.id}`}>{t.lots.lot_code}</Link> {t.lots.items.name}</dd>
              <dt className="text-slate-500">買手</dt><dd><Link className="text-sky-700" href={`/parties/${t.parties.id}`}>{t.parties.code} {t.parties.name}</Link></dd>
              <dt className="text-slate-500">区分</dt><dd>{t.parties.party_type}</dd>
              <dt className="text-slate-500">数量</dt><dd>{num(t.qty)} {t.lots.items.unit}</dd>
              <dt className="text-slate-500">単価／金額</dt><dd>{yen(t.unit_price)}／<b>{yen(t.amount)}</b></dd>
              <dt className="text-slate-500">入力者</dt><dd>{t.creator?.display_name ?? '—'}</dd>
              <dt className="text-slate-500">確定者</dt><dd>{t.confirmer?.display_name ?? '—'} {t.confirmed_at && <span className="text-xs text-slate-500">{dateTime(t.confirmed_at)}</span>}</dd>
              {t.seri_time && <><dt className="text-slate-500">せり結果時刻</dt><dd>{t.seri_time.slice(0, 5)}</dd></>}
              {t.cancel_reason && <><dt className="text-slate-500">取消理由</dt><dd>{t.cancel_reason}</dd></>}
            </dl>
            {canConfirm && (
              <div className="mt-4 space-y-2">
                <Button disabled={busy} onClick={async () => { if (await run(() => apiSend(`/api/trades/${id}`, { action: 'confirm' }), '確定しました')) reload(); }}>
                  {t.trade_type === 'せり' ? 'せり結果を確認して確定' : '確定'}
                </Button>
                <Message message={message} />
              </div>
            )}
          </Card>
          <div className="space-y-4">
            {can('trade.write') && t.entry_kind === '通常' && t.status !== '取消' && !data.dayLocked && data.deliveries.length === 0 && <CancelTradeForm tradeId={t.id} onDone={reload} />}
            {can('delivery.write') && isNormalConfirmed && t.delivery_status !== '完了' && (
              <DeliveryForm tradeId={t.id} onDone={reload} remaining={Math.max(target - delivered, 0)} unit={t.lots.items.unit} />
            )}
            {can('correction.request') && isNormalConfirmed && !hasPendingCorrection && (
              <CorrectionRequestForm tradeId={t.id} onDone={reload} qty={Number(t.qty)} unitPrice={t.unit_price} />
            )}
          </div>
          <Card title={`引渡し（${num(delivered)} / ${num(target)} ${t.lots.items.unit}）`} className="lg:col-span-3">
            <p className="mb-2 text-sm">引渡し状態: <Badge>{t.delivery_status}</Badge></p>
            <Table head={['回', '数量', '例外', '理由', '記録者', '記録時刻']}>
              {data.deliveries.map((d) => (
                <tr key={d.id}><Td>{d.seq}</Td><Td>{num(d.qty)}</Td><Td>{d.exception_type ? <Badge>例外</Badge> : ''} {d.exception_type}</Td>
                  <Td>{d.reason}</Td><Td>{d.recorder?.display_name}</Td><Td>{dateTime(d.recorded_at)}</Td></tr>
              ))}
            </Table>
          </Card>
          {(data.corrections.length > 0 || data.adjustments.length > 0) && (
            <Card title="確定後修正と赤黒レコード" className="lg:col-span-3">
              <ul className="mb-3 space-y-1 text-sm">
                {data.corrections.map((c) => <li key={c.id}><Link href="/corrections" className="text-sky-700">{c.correction_code}</Link> <Badge>{c.status}</Badge> 数量 {num(c.new_qty)}・単価 {yen(c.new_unit_price)}／{c.reason}</li>)}
              </ul>
              <Table head={['取引コード', '区分', '業務日', '数量', '単価', '金額']}>
                {data.adjustments.map((a) => (
                  <tr key={a.id}><Td><Link href={`/trades/${a.id}`} className="text-sky-700">{a.trade_code}</Link></Td><Td><Badge>{a.entry_kind}</Badge></Td>
                    <Td>{a.business_day}</Td><Td>{num(a.qty)}</Td><Td>{yen(a.unit_price)}</Td><Td>{yen(a.amount)}</Td></tr>
                ))}
              </Table>
            </Card>
          )}
          <Card title="監査履歴" className="lg:col-span-3">
            <Table head={['日時', '操作', '実行者', '理由']}>
              {data.history.map((h) => <tr key={h.id}><Td>{dateTime(h.at)}</Td><Td>{h.action}</Td><Td>{h.actor_email}</Td><Td>{h.reason}</Td></tr>)}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
