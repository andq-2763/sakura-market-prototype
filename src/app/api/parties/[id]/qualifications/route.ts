// 参加資格の登録と一時停止の切替。参加区分と参加根拠の組合せを強制する（許可と承認を混同しない）
import { ApiError, handle, readJson, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit } from '@/lib/api/audit-and-business-day';
import { BASIS_BY_PARTY_TYPE } from '@/lib/api/party-qualification-status';
import { db } from '@/lib/supabase/service-role-client';

type Ctx = { params: Promise<{ id: string }> };
type Body = { basis?: string; certificate_no?: string; valid_from?: string; valid_to?: string; note?: string };

export const POST = handle(async (req, { params }: Ctx) => {
  const user = await requirePermission('party.write');
  const { id } = await params;
  const body = await readJson<Body>(req);
  const party = unwrap(await db().from('parties').select('code, party_type').eq('id', id).single()) as { code: string; party_type: string };
  const expected = BASIS_BY_PARTY_TYPE[party.party_type];
  if (body.basis !== expected) throw new ApiError(400, `${party.party_type}の参加根拠は「${expected}」です（${body.basis ?? '未指定'}は登録できません）`);
  const validFrom = requireText(body.valid_from, '有効開始日');
  const validTo = requireText(body.valid_to, '最終有効日');
  if (validTo < validFrom) throw new ApiError(400, '最終有効日は有効開始日以降にしてください');
  const row = unwrap(await db().from('party_qualifications').insert({
    party_id: Number(id), basis: expected, certificate_no: requireText(body.certificate_no, '証番号'),
    valid_from: validFrom, valid_to: validTo, note: body.note || null,
  }).select().single());
  await audit(user, '参加資格登録', 'party', party.code, null, row);
  return row;
});

export const PATCH = handle(async (req, { params }: Ctx) => {
  const user = await requirePermission('party.write');
  const { id } = await params;
  const body = await readJson<{ qualification_id?: number; suspended?: boolean; reason?: string }>(req);
  const reason = requireText(body.reason, '理由');
  const before = unwrap(await db().from('party_qualifications').select('*').eq('id', body.qualification_id ?? -1).eq('party_id', id).single()) as { suspended: boolean };
  const after = unwrap(await db().from('party_qualifications').update({ suspended: Boolean(body.suspended) })
    .eq('id', body.qualification_id!).select().single());
  await audit(user, body.suspended ? '参加資格一時停止' : '参加資格一時停止解除', 'party_qualification', String(body.qualification_id),
    { suspended: before.suspended }, { suspended: Boolean(body.suspended) }, reason);
  return after;
});
