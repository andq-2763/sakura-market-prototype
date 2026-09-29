import { currentUser, handle } from '@/lib/api/api-route-helpers';
import { currentBusinessDay } from '@/lib/api/audit-and-business-day';

export const GET = handle(async () => ({ user: await currentUser(), businessDay: await currentBusinessDay() }));
