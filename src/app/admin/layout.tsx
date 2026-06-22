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
import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/server/auth';
import { logout } from '@/server/actions';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { AdminNav } from '@/components/admin/AdminNav';

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
          {/* 左上ロゴ: クリックでホーム（/）へ戻る */}
          <Link
            href="/"
            aria-label="ホームへ戻る（Seihu Portal トップ）"
            title="ホームへ戻る"
            className="focus-ring group -m-1 flex min-h-[44px] items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-muted cursor-pointer no-underline"
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M3 9.5 12 4l9 5.5" />
                <path d="M4 10h16" />
                <path d="M5.5 10v7.5M9.5 10v7.5M14.5 10v7.5M18.5 10v7.5" />
                <path d="M3.5 17.5h17" />
                <path d="M2.5 21h19" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-bold text-foreground">
                Seihu Portal
              </span>
              <span className="text-xs text-muted-foreground">管理画面</span>
            </span>
          </Link>
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
        <AdminNav isAdmin={isAdmin(user)} />
      </header>
      {children}
    </div>
  );
}
