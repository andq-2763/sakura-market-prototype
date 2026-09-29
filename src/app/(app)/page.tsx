'use client';
// ホーム（SCR-003）: 当日の業務状況と対応待ち
import Link from 'next/link';
import { useApi } from '@/components/use-api';
import { Card, LoadState, PageHeader, yen } from '@/components/ui-primitives';

type Dashboard = {
  businessDay: string; dayLocked: boolean; lotsByStatus: Record<string, number>;
  confirmedCount: { 相対: number; せり: number }; confirmedAmount: number;
  pending: Record<'drafts' | 'seriToApprove' | 'deliveriesOpen' | 'deliveryExceptions' | 'corrections' | 'rateDrafts' | 'expiringQualifications' | 'unlockedPastDays', number>;
};

const LOT_STATUSES = ['受付', '下見済', '公開', '売買確定', '引渡し完了'];

export default function DashboardPage() {
  const { data, loading, error } = useApi<Dashboard>('/api/dashboard');
  const total = data ? data.confirmedCount.相対 + data.confirmedCount.せり : 0;
  const todo: [string, number, string][] = data ? [
    ['下書きの相対取引', data.pending.drafts, '/trades?status=下書き'],
    ['確認待ちのせり結果', data.pending.seriToApprove, '/seri'],
    ['未完了の引渡し', data.pending.deliveriesOpen, '/deliveries'],
    ['引渡し例外', data.pending.deliveryExceptions, '/deliveries'],
    ['承認待ちの修正依頼', data.pending.corrections, '/corrections'],
    ['承認待ちの料率版', data.pending.rateDrafts, '/rates'],
    ['30日以内に失効する参加資格', data.pending.expiringQualifications, '/parties'],
    ['未ロックの過去業務日', data.pending.unlockedPastDays, '/settlement'],
  ] : [];

  return (
    <>
      <PageHeader title="ホーム" description="当日の業務状況（すべて Supabase のデータから集計）" />
      <LoadState loading={loading} error={error} />
      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={`業務日 ${data.businessDay}`}>
            <p className="text-sm">{data.dayLocked ? '締め済み（ロック）' : '受付中'}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {LOT_STATUSES.map((s) => (
                <div key={s} className="rounded bg-slate-50 px-2 py-1.5">
                  <dt className="text-xs text-slate-500">ロット {s}</dt><dd className="text-lg font-bold">{data.lotsByStatus[s] ?? 0}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="当日の確定取引">
            <p className="text-2xl font-bold">{yen(data.confirmedAmount)}</p>
            <p className="mt-2 text-sm text-slate-600">相対 {data.confirmedCount.相対} 件／せり {data.confirmedCount.せり} 件</p>
            {total > 0 && (
              <div className="mt-3 flex h-3 overflow-hidden rounded bg-slate-100" aria-label="相対とせりの件数比">
                <div className="bg-teal-600" style={{ width: `${(data.confirmedCount.相対 / total) * 100}%` }} />
                <div className="bg-orange-400" style={{ width: `${(data.confirmedCount.せり / total) * 100}%` }} />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">相対取引が主フロー、せりは補助フロー（人が確定した結果のみ記録）</p>
          </Card>
          <Card title="対応待ち">
            <ul className="space-y-1.5 text-sm">
              {todo.map(([label, n, href]) => (
                <li key={label} className="flex justify-between">
                  <Link href={href} className="text-sky-700 hover:underline">{label}</Link>
                  <span className={n > 0 ? 'font-bold text-amber-700' : 'text-slate-400'}>{n}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
