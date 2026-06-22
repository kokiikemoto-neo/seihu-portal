/**
 * 管理画面: 案件・進捗 一覧（③ システム系 / 見た目の詳細は②）
 *
 * 閲覧は全ログインユーザー。編集系（作成・削除）は管理者のみ（canEdit で制御。
 * 各 Server Action 内の requireAdmin と併せた多層防御）。
 * listProjects() で一覧を取得し、ProjectList（Client）に一覧と Server Action を
 * props として渡す。Server Component（データ取得をサーバーで実行）。
 */
import type { Metadata } from 'next';
import { getCurrentUser } from '@/server/auth';
import {
  listProjects,
  createProject,
  deleteProject,
} from '@/server/projectActions';
import { ProjectList } from '@/components/tracking/ProjectList';

export const metadata: Metadata = {
  title: '案件・進捗',
};

export default async function AdminProjectsPage() {
  const currentUser = await getCurrentUser();
  const canEdit = currentUser?.role === 'admin';

  const projects = await listProjects();

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">案件・進捗</h1>
      <p className="mt-2 text-sm">
        案件ごとに必要書類と進捗を管理します。
        {canEdit
          ? '案件・書類の追加や削除、ステータスの変更ができます。'
          : '閲覧専用です（編集は管理者のみ）。'}
      </p>

      <section className="mt-6" aria-label="案件の一覧">
        <ProjectList
          projects={projects}
          canEdit={canEdit}
          createAction={createProject}
          deleteAction={deleteProject}
        />
      </section>
    </main>
  );
}
