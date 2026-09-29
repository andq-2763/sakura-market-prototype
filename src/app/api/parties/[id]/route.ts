// 参加者詳細: プロファイル・参加資格・直近の取引
import { ApiError, currentUser, handle, unwrap } from '@/lib/api/api-route-helpers';
import { currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { qualificationStatus, type Qualification } from '@/lib/api/party-qualification-status';
import { db } from '@/lib/supabase/service-role-client';

export const GET = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  await currentUser();
  const { id } = await params;
  const day = await currentBusinessDay();
  const party = unwrap(await db().from('parties').select('*').eq('id', id).maybeSingle()) as { party_type: string } | null;
  if (!party) throw new ApiError(404, '参加者が見つかりません');
  const quals = unwrap(await db().from('party_qualifications').select('*').eq('party_id', id).order('valid_to', { ascending: false })) as Qualification[];
  const trades = unwrap(await db().from('trades').select('id, trade_code, trade_type, business_day, qty, unit_price, amount, status, entry_kind, lots(lot_code, items(name, unit))')
    .eq('buyer_party_id', id).order('id', { ascending: false }).limit(30));
  return { party, qualifications: quals, status: qualificationStatus(party.party_type, quals, day), trades };
});
