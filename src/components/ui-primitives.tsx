// 画面共通の表示部品（見出し・カード・バッジ・入力欄・メッセージ）
import type { ComponentProps, ReactNode } from 'react';

export const yen = (n: number | string | null | undefined) => `¥${Number(n ?? 0).toLocaleString('ja-JP')}`;
export const num = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString('ja-JP', { maximumFractionDigits: 1 });
export const dateTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {title && <h2 className="mb-3 text-sm font-bold text-slate-800">{title}</h2>}
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  確定: 'bg-emerald-100 text-emerald-800', 完了: 'bg-emerald-100 text-emerald-800', 有効: 'bg-emerald-100 text-emerald-800',
  承認済: 'bg-emerald-100 text-emerald-800', 承認: 'bg-emerald-100 text-emerald-800', 引渡し完了: 'bg-emerald-100 text-emerald-800',
  下書き: 'bg-slate-100 text-slate-700', 待機中: 'bg-slate-100 text-slate-700', 受付: 'bg-slate-100 text-slate-700', 草案: 'bg-slate-100 text-slate-700',
  確認待ち: 'bg-amber-100 text-amber-800', 承認待ち: 'bg-amber-100 text-amber-800', 引渡し中: 'bg-sky-100 text-sky-800', 下見済: 'bg-sky-100 text-sky-800',
  公開: 'bg-indigo-100 text-indigo-800', 売買確定: 'bg-indigo-100 text-indigo-800', 失効間近: 'bg-amber-100 text-amber-800', 追加情報要求: 'bg-amber-100 text-amber-800',
  例外: 'bg-rose-100 text-rose-800', 取消: 'bg-rose-100 text-rose-700', 期限切れ: 'bg-rose-100 text-rose-800', 一時停止: 'bg-rose-100 text-rose-800',
  却下: 'bg-rose-100 text-rose-800', ロールバック: 'bg-rose-100 text-rose-800', 未登録: 'bg-rose-100 text-rose-800', ロック済: 'bg-slate-800 text-white',
  赤: 'bg-rose-600 text-white', 黒: 'bg-slate-900 text-white', 相対: 'bg-teal-100 text-teal-800', せり: 'bg-orange-100 text-orange-800',
};

export function Badge({ children }: { children: string }) {
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${TONE[children] ?? 'bg-slate-100 text-slate-700'}`}>{children}</span>;
}

const fieldClass = 'w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const Input = (props: ComponentProps<'input'>) => <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />;
export const Select = (props: ComponentProps<'select'>) => <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />;

export function Button({ variant = 'primary', ...props }: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const tone = { primary: 'bg-sky-700 text-white hover:bg-sky-800', secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50', danger: 'bg-rose-700 text-white hover:bg-rose-800' }[variant];
  return <button {...props} className={`rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${tone} ${props.className ?? ''}`} />;
}

export function Message({ message }: { message: { kind: 'ok' | 'error'; text: string } | null }) {
  if (!message) return null;
  const tone = message.kind === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900';
  return <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded border px-3 py-2 text-sm ${tone}`}>{message.text}</p>;
}

export function LoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <Message message={{ kind: 'error', text: error }} />;
  if (loading) return <p className="text-sm text-slate-500">読み込み中…</p>;
  return null;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500">{head.map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={`px-2 py-2 align-top ${className}`}>{children}</td>;
