'use client';
// 画面から API route を呼ぶためのフック。データはすべて API（Supabase）から取得し、画面に固定値は持たない
import { useCallback, useEffect, useState } from 'react';

export class ApiRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function parse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // セッション切れ: ページ全体を読み直してログイン画面へ（proxy.ts と同じ遷移）
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiRequestError(res.status, body.error ?? `エラーが発生しました（${res.status}）`);
  return body;
}

export async function apiSend<T = unknown>(url: string, body: unknown, method: 'POST' | 'PUT' | 'PATCH' = 'POST'): Promise<T> {
  return parse(await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
}

type Result<T> = { key: string | null; data: T | null; error: string | null };

export function useApi<T>(url: string | null) {
  const [version, setVersion] = useState(0);
  const key = url ? `${url}#${version}` : null;
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null });

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    fetch(url, { cache: 'no-store' })
      .then(parse)
      .then((d) => { if (!cancelled) setResult({ key, data: d as T, error: null }); })
      .catch((e: Error) => { if (!cancelled) setResult((prev) => ({ key, data: prev.data, error: e.message })); });
    return () => { cancelled = true; };
  }, [url, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // 再読み込み中は直前のデータを表示し続ける
  return { data: result.data, error: result.error, loading: key !== null && result.key !== key && result.data === null, reload };
}

/** 送信ボタン用: 実行中フラグとエラー/成功メッセージを管理する */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const run = useCallback(async (fn: () => Promise<unknown>, okText?: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      if (okText) setMessage({ kind: 'ok', text: okText });
      return true;
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, message, setMessage, run };
}
