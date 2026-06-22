'use client';
/**
 * 管理画面ナビゲーション（② UI担当, Client Component）
 *
 * 管理画面レイアウト上部に配置するセクションナビ。
 *   - 「案件・進捗」→ /admin/projects（全ロール, 先頭）
 *   - 「ページ管理」→ /admin/pages（全ロール）
 *   - 「ユーザー管理」→ /admin/users（isAdmin の時のみ表示）
 * `usePathname`(next/navigation) で現在地を判定し、該当タブに
 * `aria-current="page"` ＋ 視覚ハイライト（背景・前景・下線インジケータ）を付与する。
 *
 * 契約: `export interface AdminNavProps { isAdmin: boolean }`。
 *       表示制御のみ。実際のアクセス制御はルート（③）と middleware（①）が担う。
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠（WCAG AAA 目標）。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/ focus-ring / 44px タッチターゲット。
 *           現在地は色だけに頼らず aria-current ＋ 下線インジケータでも区別（色覚配慮）。
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type React from 'react';

export interface AdminNavProps {
  isAdmin: boolean;
}

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
    />
  </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);

interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

/**
 * 現在地判定: 完全一致、またはセクション配下（href のサブパス）を「アクティブ」とみなす。
 * 例: /admin/builder/123 は「ページ管理」(/admin/pages) ではないため、配下判定は
 *     各タブのセクションルート（/admin/pages・/admin/users）に対して行う。
 */
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const AdminNav: React.FC<AdminNavProps> = ({ isAdmin }) => {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/admin/projects', label: '案件・進捗', Icon: ClipboardIcon },
    { href: '/admin/pages', label: 'ページ管理', Icon: DocumentIcon },
    ...(isAdmin
      ? [{ href: '/admin/users', label: 'ユーザー管理', Icon: UsersIcon }]
      : []),
  ];

  return (
    <nav aria-label="管理メニュー" className="border-b border-border bg-surface">
      <ul className="mx-auto flex w-full max-w-5xl items-stretch gap-1 px-4">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`focus-ring relative inline-flex min-h-[44px] items-center gap-2 px-4 py-3 font-sans text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
                {/* 色覚に依存しない現在地インジケータ（下線） */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-t-sm transition-colors duration-200 ${
                    active ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AdminNav;
