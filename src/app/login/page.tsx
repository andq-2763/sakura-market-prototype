'use client';
// ログイン画面（SCR-001）。未ログインで他の画面を開くと proxy.ts がここへ転送する
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { apiSend, useAction } from '@/components/use-api';
import { Button, Field, Input, Message } from '@/components/ui-primitives';

function LoginForm() {
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, message, run } = useAction();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => apiSend('/api/auth/login', { email, password }));
    if (!ok) return;
    // 外部URLへの転送を防ぐため、同一サイト内のパスのみ許可する
    const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
    // ページ全体を読み直す: クライアントのルーターキャッシュに残った「ログイン画面への転送」を使わせず、新しいセッションCookieで取得する
    window.location.replace(new URL(target, window.location.origin).href);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="メールアドレス">
        <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </Field>
      <Field label="パスワード">
        <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Message message={message} />
      <Button type="submit" disabled={busy} className="w-full py-2">{busy ? 'ログイン中…' : 'ログイン'}</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <p className="text-xs text-slate-500">株式会社 桜水産市場</p>
        <h1 className="mb-1 text-lg font-bold text-slate-900">業務支援システム</h1>
        <p className="mb-5 text-xs text-slate-500">研修用プロトタイプ（架空の市場・架空のデータ）。デモアカウントは README を参照してください。</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
