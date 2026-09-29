// 完納奨励金の料率版: 一覧と起票（将来発効日のみ。承認されるまで適用されない）
import { ApiError, currentUser, handle, readJson, requireNumber, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async () => {
  await currentUser();
  return unwrap(await db().from('rate_versions')
    .select('*, creator:profiles!rate_versions_created_by_fkey(display_name), approver:profiles!rate_versions_approved_by_fkey(display_name)')
    .order('version_no', { ascending: false }));
});

type Body = { effective_from?: string; rate_bp?: number; threshold_amount?: number; payment_due_days?: number; note?: string };

export const POST = handle(async (req) => {
  const user = await requirePermission('rate.draft');
  const body = await readJson<Body>(req);
  const effectiveFrom = requireText(body.effective_from, '発効日');
  if (effectiveFrom <= (await currentBusinessDay())) throw new ApiError(400, '発効日は翌業務日以降の日付にしてください（確定済みデータを変えないため）');
  const { data: last } = await db().from('rate_versions').select('version_no').order('version_no', { ascending: false }).limit(1).maybeSingle();
  const row = unwrap(await db().from('rate_versions').insert({
    version_no: (last?.version_no ?? 0) + 1, effective_from: effectiveFrom,
    rate_bp: Math.round(requireNumber(body.rate_bp, '交付率')), threshold_amount: Math.round(requireNumber(body.threshold_amount, '最低閾値')),
    payment_due_days: Math.round(requireNumber(body.payment_due_days, '支払日数')), note: body.note || null, created_by: user.id,
  }).select().single()) as { version_no: number };
  await audit(user, '料率版起票', 'rate_version', `v${row.version_no}`, null, row);
  return row;
});
