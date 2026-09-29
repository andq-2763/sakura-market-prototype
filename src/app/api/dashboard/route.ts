// ホーム: 当日の業務状況と対応待ちの件数
import { currentUser, handle, unwrap } from '@/lib/api/api-route-helpers';
import { currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
  const { count: c, error } = await q;
  if (error) throw new Error(error.message);
  return c ?? 0;
};

export const GET = handle(async () => {
  await currentUser();
  const day = await currentBusinessDay();
  const soon = new Date(Date.parse(`${day}T00:00:00Z`) + 30 * 86400_000).toISOString().slice(0, 10);
  const lots = unwrap(await db().from('lots').select('status').eq('business_day', day)) as { status: string }[];
  const trades = unwrap(await db().from('trades').select('trade_type, status, amount')
    .eq('business_day', day).eq('entry_kind', '通常')) as { trade_type: string; status: string; amount: number }[];
  const confirmed = trades.filter((t) => t.status === '確定');
  const t = () => db().from('trades').select('id', { count: 'exact', head: true });
  return {
    businessDay: day,
    dayLocked: Boolean((unwrap(await db().from('business_days').select('locked').eq('day', day).maybeSingle()) as { locked?: boolean } | null)?.locked),
    lotsByStatus: lots.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }), {}),
    confirmedCount: { 相対: confirmed.filter((x) => x.trade_type === '相対').length, せり: confirmed.filter((x) => x.trade_type === 'せり').length },
    confirmedAmount: confirmed.reduce((s, x) => s + Number(x.amount), 0),
    pending: {
      drafts: await count(t().eq('status', '下書き')),
      seriToApprove: await count(t().eq('status', '確認待ち')),
      deliveriesOpen: await count(t().eq('status', '確定').eq('entry_kind', '通常').in('delivery_status', ['待機中', '引渡し中'])),
      deliveryExceptions: await count(t().eq('status', '確定').eq('delivery_status', '例外')),
      corrections: await count(db().from('corrections').select('id', { count: 'exact', head: true }).eq('status', '承認待ち')),
      rateDrafts: await count(db().from('rate_versions').select('id', { count: 'exact', head: true }).eq('status', '草案')),
      expiringQualifications: await count(db().from('party_qualifications').select('id', { count: 'exact', head: true })
        .gte('valid_to', day).lte('valid_to', soon)),
      unlockedPastDays: await count(db().from('business_days').select('day', { count: 'exact', head: true }).lt('day', day).eq('locked', false)),
    },
  };
});
