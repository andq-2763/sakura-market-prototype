'use client';
// ログイン後の共通レイアウト: 権限に応じたメニュー、業務日、利用者、ログアウト
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { ROLES, type Permission, type Role } from '@/lib/permissions';
import { apiSend, useApi } from './use-api';

type Me = { user: { id: string; email: string; name: string; role: Role; permissions: Permission[] }; businessDay: string };
const MeContext = createContext<Me | null>(null);

export function useMe() {
  const me = useContext(MeContext);
  return { me, can: (p: Permission) => Boolean(me?.user.permissions.includes(p)) };
}

const NAV: { href: string; label: string; permission?: Permission; group: string }[] = [
  { href: '/', label: 'ホーム', group: '業務' },
  { href: '/lots', label: 'ロット受付・評価', group: '業務' },
  { href: '/trades/new', label: '相対取引 入力', group: '業務' },
  { href: '/seri', label: 'せり結果 記録', group: '業務' },
  { href: '/trades', label: '取引一覧', group: '業務' },
  { href: '/deliveries', label: '引渡し管理', group: '業務' },
  { href: '/settlement', label: '日次照合・締め', group: '照合・精算' },
  { href: '/corrections', label: '確定後修正（赤黒）', group: '照合・精算' },
  { href: '/incentives', label: '完納奨励金', group: '照合・精算' },
  { href: '/rates', label: '料率版管理', group: '照合・精算' },
  { href: '/reports', label: '帳票・会計連携', group: '照合・精算' },
  { href: '/parties', label: '参加者・参加資格', group: '管理' },
  { href: '/audit', label: '監査ログ', permission: 'audit.read', group: '管理' },
  { href: '/admin/users', label: 'アカウント管理', permission: 'admin.users', group: '管理' },
  { href: '/admin/roles', label: 'ロール・権限設定', permission: 'admin.roles', group: '管理' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, error } = useApi<Me>('/api/me');
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.permission || me?.user.permissions.includes(n.permission));
  const groups = [...new Set(items.map((n) => n.group))];
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname === href || (pathname.startsWith(`${href}/`) && href !== '/trades') || (href === '/trades' && /^\/trades\/\d+/.test(pathname)));

  async function logout() {
    await apiSend('/api/auth/logout', {});
    router.replace('/login');
  }

  return (
    <MeContext.Provider value={me}>
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-900 text-slate-100 md:block">
          <div className="px-4 py-4">
            <p className="text-xs text-slate-400">桜水産市場</p>
            <p className="text-sm font-bold">業務支援システム</p>
          </div>
          <nav className="px-2 pb-6">
            {groups.map((g) => (
              <div key={g} className="mb-3">
                <p className="px-2 pb-1 text-xs text-slate-400">{g}</p>
                {items.filter((n) => n.group === g).map((n) => (
                  <Link key={n.href} href={n.href} className={`block rounded px-2 py-1.5 text-sm ${active(n.href) ? 'bg-sky-700 text-white' : 'text-slate-200 hover:bg-slate-800'}`}>
                    {n.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-2.5">
            <nav className="flex gap-3 overflow-x-auto text-sm md:hidden">
              {items.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap text-sky-700">{n.label}</Link>)}
            </nav>
            <p className="text-sm text-slate-700">業務日 <span className="font-bold">{me?.businessDay ?? '—'}</span><span className="ml-2 text-xs text-slate-500">（02:00 JST 起点）</span></p>
            <div className="flex items-center gap-3 text-sm">
              {me && <span className="text-slate-700">{me.user.name}<span className="ml-1 text-xs text-slate-500">／{ROLES[me.user.role]}</span></span>}
              <button onClick={logout} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">ログアウト</button>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-6">
            {error ? <p className="text-sm text-rose-700">{error}</p> : children}
          </main>
        </div>
      </div>
    </MeContext.Provider>
  );
}
