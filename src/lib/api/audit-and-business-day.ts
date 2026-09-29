// API route から監査ログを記録し、現在の業務日を得る
import 'server-only';
import { db } from '@/lib/supabase/service-role-client';
import { unwrap, type CurrentUser } from './api-route-helpers';

export async function audit(user: CurrentUser, action: string, entity: string, entityId: string,
  before: unknown, after: unknown, reason?: string) {
  unwrap(await db().rpc('fn_audit', {
    p_actor: user.id, p_action: action, p_entity: entity, p_entity_id: entityId,
    p_before: before ?? null, p_after: after ?? null, p_reason: reason ?? null,
  }));
}

/** 業務日（JST 02:00 起点）。DB関数と同じ定義を使う */
export async function currentBusinessDay(): Promise<string> {
  return unwrap(await db().rpc('fn_business_day')) as string;
}

export function assertIsoDate(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}
