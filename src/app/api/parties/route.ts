// 参加者一覧（資格状態つき）と新規登録
import { ApiError, currentUser, handle, readJson, requirePermission, requireText, unwrap } from '@/lib/api/api-route-helpers';
import { audit, currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { BASIS_BY_PARTY_TYPE, qualificationStatus, type Qualification } from '@/lib/api/party-qualification-status';
import { db } from '@/lib/supabase/service-role-client';

type PartyRow = { id: number; code: string; name: string; party_type: string; email: string | null; party_qualifications: Qualification[] };

export const GET = handle(async () => {
  await currentUser();
  const day = await currentBusinessDay();
  const rows = unwrap(await db().from('parties').select('id, code, name, party_type, email, party_qualifications(*)').order('code')) as PartyRow[];
  return rows.map(({ party_qualifications, ...p }) => ({ ...p, qualification: qualificationStatus(p.party_type, party_qualifications, day) }));
});

export const POST = handle(async (req) => {
  const user = await requirePermission('party.write');
  const body = await readJson<{ code?: string; name?: string; party_type?: string; email?: string }>(req);
  const partyType = requireText(body.party_type, '参加区分');
  if (!(partyType in BASIS_BY_PARTY_TYPE)) throw new ApiError(400, '参加区分が不正です');
  const code = requireText(body.code, '参加者コード').toUpperCase();
  const { data, error } = await db().from('parties')
    .insert({ code, name: requireText(body.name, '名称'), party_type: partyType, email: body.email || null }).select().single();
  if (error?.code === '23505') throw new ApiError(409, `参加者コード ${code} は既に使われています`);
  const party = unwrap({ data, error });
  await audit(user, '参加者登録', 'party', code, null, party);
  return party;
});
