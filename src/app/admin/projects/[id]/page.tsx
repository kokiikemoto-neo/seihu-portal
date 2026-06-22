/**
 * 管理画面: 案件詳細（③ システム系 / 見た目の詳細は②）
 *
 * 閲覧は全ログインユーザー。編集系（案件・書類の追加・変更・削除・ステータス変更）は
 * 管理者のみ（canEdit で制御。各 Server Action 内の requireAdmin と併せた多層防御）。
 * getProject(id) で案件詳細を取得し、不在なら notFound()。
 * ProjectDetail（Client）に案件と各 Server Action を props として渡す。
 * 案件削除の成功後の一覧への遷移はコンポーネント側で行う想定。
 *
 * Next.js 16: params は Promise。await してから利用する。
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';
import {
  getProject,
  updateProject,
  deleteProject,
  addDocument,
  updateDocument,
  deleteDocument,
} from '@/server/projectActions';
import { ProjectDetail } from '@/components/tracking/ProjectDetail';

export const metadata: Metadata = {
  title: '案件詳細',
};

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  const canEdit = currentUser?.role === 'admin';

  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8">
      <ProjectDetail
        project={project}
        canEdit={canEdit}
        updateProjectAction={updateProject}
        deleteProjectAction={deleteProject}
        addDocumentAction={addDocument}
        updateDocumentAction={updateDocument}
        deleteDocumentAction={deleteDocument}
      />
    </main>
  );
}
