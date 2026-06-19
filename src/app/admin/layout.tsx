/**
 * 管理画面レイアウト（③ 配線 / LogoutButton の UI は ②）
 *
 * Server Component:
 *   - 上部バーに現在のユーザー名／メールを表示（middleware で保護済だが表示用に取得）。
 *   - ② の LogoutButton（logoutAction={logout}）を配置。
 *   - {children} に各 admin ページを描画。
 *
 * 認証自体は src/middleware.ts（① 実装、/admin 配下）が担う。ここでは表示用に
 * getCurrentUser() を読むのみ（layout は cookies() を読めるが request 単位で動く）。
 */
import type { Metadata } from 'next';
import { getCurrentUser } from '@/server/auth';
import { logout } from '@/server/actions';
import { LogoutButton } from '@/components/auth/LogoutButton';

export const metadata: Metadata = {
  title: {
    default: '管理画面',
    template: '%s | 管理画面 | Seihu Portal',
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware で保護済のため通常 user は存在するが、念のため null 安全に扱う。
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm font-semibold">Seihu Portal 管理画面</p>
          <div className="flex items-center gap-4">
            {user && (
              <span className="flex flex-col text-right text-sm leading-tight">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </span>
            )}
            <LogoutButton logoutAction={logout} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
