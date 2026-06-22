/**
 * 管理画面: ユーザー管理（③ システム系 / 見た目の詳細は②）
 *
 * 管理者専用ページ。利用者（role!=='admin'）は閲覧不可とし /admin/pages へ退避させる
 * （middleware／各アクションの requireAdmin と併せた多層防御）。
 * listUsers() でユーザー一覧を取得し、UserManager（Client）に一覧と各 Server Action を
 * props として渡す。Server Component（データ取得をサーバーで実行）。
 *
 * 注: redirect は内部で例外を投げるため、データ取得（try なし）より前に呼ぶ。
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import {
  listUsers,
  createUser,
  deleteUser,
  updateUserRole,
} from '@/server/userActions';
import { UserManager } from '@/components/admin/UserManager';

export const metadata: Metadata = {
  title: 'ユーザー管理',
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  // 管理者のみ閲覧可。利用者・未ログインはページ管理へ退避。
  if (currentUser?.role !== 'admin') {
    redirect('/admin/pages');
  }

  const users = await listUsers();

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ユーザー管理</h1>
      <p className="mt-2 text-sm">
        アカウントの追加・削除、ロール（管理者 / 利用者）の変更ができます。
      </p>

      <section className="mt-6" aria-label="ユーザーの管理">
        <UserManager
          users={users}
          currentUserId={currentUser.id}
          createAction={createUser}
          deleteAction={deleteUser}
          updateRoleAction={updateUserRole}
        />
      </section>
    </main>
  );
}
