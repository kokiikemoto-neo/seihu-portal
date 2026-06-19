/**
 * ログイン画面（③ 配線 / UI は ② の LoginForm）
 *
 * Server Component:
 *   1. 既にログイン済み（getCurrentUser）なら /admin/pages へリダイレクト。
 *   2. searchParams（Next.js 16 では Promise）の `from` をサニタイズして redirectTo を決定。
 *      - open-redirect 対策: `/` 始まり かつ `//`（プロトコル相対）でない場合のみ採用。
 *      - 既定は /admin/pages。
 *   3. ② の LoginForm（Client Component）へ loginAction / redirectTo を渡す。
 *
 * この画面は middleware の matcher（/admin 配下のみ）の対象外＝未ログインで公開アクセス可能。
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import { login } from '@/server/actions';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'ログイン',
  robots: { index: false, follow: false },
};

const DEFAULT_REDIRECT = '/admin/pages';

/**
 * リダイレクト先候補をサニタイズする。
 * 自サイト内の絶対パス（`/` 始まり）のみ許可し、プロトコル相対（`//`）や
 * バックスラッシュ偽装（`/\`）は弾く。不正・未指定なら既定値。
 */
function sanitizeRedirect(from: string | string[] | undefined): string {
  const value = Array.isArray(from) ? from[0] : from;
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
  ) {
    return value;
  }
  return DEFAULT_REDIRECT;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 既にログイン済みなら管理画面へ。
  const user = await getCurrentUser();
  if (user) {
    redirect(DEFAULT_REDIRECT);
  }

  const { from } = await searchParams;
  const redirectTo = sanitizeRedirect(from);

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm loginAction={login} redirectTo={redirectTo} />
    </main>
  );
}
