// 監査ログ検索（FR-AUDIT-02）: 対象ID（取引コード等）・操作・実行者・期間
import { handle, requirePermission, unwrap } from '@/lib/api/api-route-helpers';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async (req) => {
  await requirePermission('audit.read');
  const p = new URL(req.url).searchParams;
  let q = db().from('audit_logs').select('*').order('at', { ascending: false }).limit(200);
  const text = (k: string) => (p.get(k) ?? '').trim().replace(/[%,()]/g, '');
  if (text('entity_id')) q = q.ilike('entity_id', `%${text('entity_id')}%`);
  if (text('action')) q = q.ilike('action', `%${text('action')}%`);
  if (text('actor')) q = q.ilike('actor_email', `%${text('actor')}%`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.get('from') ?? '')) q = q.gte('at', `${p.get('from')}T00:00:00+09:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.get('to') ?? '')) q = q.lte('at', `${p.get('to')}T23:59:59+09:00`);
  return unwrap(await q);
});
