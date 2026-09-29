'use client';
// 取引詳細の操作フォーム: 取消（FR-AITAI-03）、引渡し記録（FR-DEL）、確定後修正の起票（FR-CORR-01）
import { useState, type FormEvent } from 'react';
import { apiSend, useAction } from './use-api';
import { Button, Card, Field, Input, Message, Select } from './ui-primitives';

type Props = { tradeId: number; onDone: () => void };

export function CancelTradeForm({ tradeId, onDone }: Props) {
  const [reason, setReason] = useState('');
  const { busy, message, run } = useAction();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => apiSend(`/api/trades/${tradeId}`, { action: 'cancel', reason }), '取引を取り消しました')) onDone();
  };
  return (
    <Card title="取消（未ロックの業務日のみ）">
      <form onSubmit={submit} className="space-y-2">
        <Field label="取消理由（必須）"><Input required value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Button variant="danger" disabled={busy}>取り消す</Button>
        <Message message={message} />
      </form>
    </Card>
  );
}

export function DeliveryForm({ tradeId, onDone, remaining, unit }: Props & { remaining: number; unit: string }) {
  const [qty, setQty] = useState(String(remaining));
  const [exception, setException] = useState('');
  const [reason, setReason] = useState('');
  const { busy, message, run } = useAction();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => apiSend(`/api/trades/${tradeId}/deliveries`, { qty: Number(qty), exception_type: exception || null, reason }), '引渡しを記録しました');
    if (ok) { setReason(''); onDone(); }
  };
  return (
    <Card title="引渡し記録（分割可）">
      <form onSubmit={submit} className="space-y-2">
        <Field label={`今回の引渡し数量（${unit}）`} hint={`残数量 ${remaining} ${unit}`}>
          <Input required type="number" min="0" step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="例外（数量が合わない場合）">
          <Select value={exception} onChange={(e) => setException(e.target.value)}>
            <option value="">なし</option><option>不足</option><option>超過</option><option>返却</option><option>部分キャンセル</option>
          </Select>
        </Field>
        {exception && <Field label="例外の理由（必須）"><Input required value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
        <Button disabled={busy}>記録</Button>
        <Message message={message} />
      </form>
    </Card>
  );
}

export function CorrectionRequestForm({ tradeId, onDone, qty, unitPrice }: Props & { qty: number; unitPrice: number }) {
  const [form, setForm] = useState({ new_qty: String(qty), new_unit_price: String(unitPrice), reason: '', evidence_note: '' });
  const { busy, message, run } = useAction();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => apiSend('/api/corrections', { trade_id: tradeId, ...form, new_qty: Number(form.new_qty), new_unit_price: Number(form.new_unit_price) }),
      '修正依頼を起票しました（承認されるまで元の取引は変わりません）');
    if (ok) onDone();
  };
  return (
    <Card title="確定後修正の依頼（FORM-CORR-01）">
      <form onSubmit={submit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="訂正後数量"><Input required type="number" min="0" step="0.1" value={form.new_qty} onChange={(e) => setForm({ ...form, new_qty: e.target.value })} /></Field>
          <Field label="訂正後単価"><Input required type="number" min="0" value={form.new_unit_price} onChange={(e) => setForm({ ...form, new_unit_price: e.target.value })} /></Field>
        </div>
        <Field label="修正理由（必須）"><Input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        <Field label="添付証拠（メモ）" hint="プロトタイプではファイル添付の代わりにメモを保存"><Input value={form.evidence_note} onChange={(e) => setForm({ ...form, evidence_note: e.target.value })} /></Field>
        <Button disabled={busy}>起票</Button>
        <Message message={message} />
      </form>
    </Card>
  );
}
