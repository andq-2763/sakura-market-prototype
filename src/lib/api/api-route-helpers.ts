// API route 共通処理: ログイン利用者と権限の取得、エラーの HTTP ステータス変換
import 'server-only';
import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server-session-client';
import { db } from '@/lib/supabase/service-role-client';
import type { Permission, Role } from '@/lib/permissions';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type CurrentUser = { id: string; email: string; name: string; role: Role; permissions: Permission[] };

export async function currentUser(): Promise<CurrentUser> {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) throw new ApiError(401, 'ログインが必要です');
  const { data: profile } = await db().from('profiles').select('id, email, display_name, role, active').eq('id', user.id).single();
  if (!profile || !profile.active) throw new ApiError(403, 'このアカウントは利用できません');
  const { data: perms } = await db().from('role_permissions').select('permission').eq('role', profile.role);
  return {
    id: profile.id, email: profile.email, name: profile.display_name, role: profile.role,
    permissions: (perms ?? []).map((p) => p.permission as Permission),
  };
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user.permissions.includes(permission)) throw new ApiError(403, `権限がありません（${permission}）`);
  return user;
}

/** Supabase の戻り値を検査し、エラーなら例外にする。DB関数の業務エラー（raise exception）は 409 */
export function unwrap<T>(result: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    const isBusinessRule = result.error.code === 'P0001' || result.error.code === '23514';
    if (isBusinessRule) throw new ApiError(409, result.error.message);
    console.error('DB error', result.error);
    throw new ApiError(500, 'データベースの処理に失敗しました');
  }
  return result.data as T;
}

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** 例外を JSON のエラー応答に変換するラッパー */
export function handle<C>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    try {
      const body = await fn(req, ctx);
      return body instanceof Response ? body : NextResponse.json(body ?? { ok: true });
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      console.error(err);
      return NextResponse.json({ error: 'サーバエラーが発生しました' }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, 'リクエストの形式が不正です');
  }
}

export function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new ApiError(400, `${label}は必須です`);
  return value.trim();
}

export function requireNumber(value: unknown, label: string, { min = 0 } = {}): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min) throw new ApiError(400, `${label}が不正です`);
  return n;
}
