// ログイン（Supabase Auth: メール＋パスワード）。成功するとセッションCookieが設定される
import { createSessionClient } from '@/lib/supabase/server-session-client';
import { ApiError, handle, readJson, requireText } from '@/lib/api/api-route-helpers';

export const POST = handle(async (req) => {
  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = requireText(body.email, 'メールアドレス');
  const password = requireText(body.password, 'パスワード');
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ApiError(401, 'メールアドレスまたはパスワードが正しくありません');
  return { ok: true };
});
