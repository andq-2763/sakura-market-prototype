// 入力画面の選択肢: 品目・荷主・買手（資格状態つき）・販売中ロット
import { currentUser, handle, unwrap } from '@/lib/api/api-route-helpers';
import { currentBusinessDay } from '@/lib/api/audit-and-business-day';
import { qualificationStatus, type Qualification } from '@/lib/api/party-qualification-status';
import { db } from '@/lib/supabase/service-role-client';

type PartyRow = { id: number; code: string; name: string; party_type: string; party_qualifications: Qualification[] };

export const GET = handle(async () => {
  await currentUser();
  const day = await currentBusinessDay();
  const parties = unwrap(await db().from('parties').select('id, code, name, party_type, party_qualifications(*)')
    .neq('party_type', '卸売業者').order('code')) as PartyRow[];
  return {
    businessDay: day,
    items: unwrap(await db().from('items').select('id, code, name, unit').order('code')),
    shippers: unwrap(await db().from('shippers').select('id, code, name').order('code')),
    buyers: parties.map(({ party_qualifications, ...p }) => ({ ...p, qualification: qualificationStatus(p.party_type, party_qualifications, day) })),
    lotsForSale: unwrap(await db().from('lots').select('id, lot_code, available_qty, status, items(name, unit)')
      .eq('business_day', day).in('status', ['公開', '売買確定']).gt('available_qty', 0).order('lot_code')),
  };
});
