import { createSessionClient } from '@/lib/supabase/server-session-client';
import { handle } from '@/lib/api/api-route-helpers';

export const POST = handle(async () => {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return { ok: true };
});
