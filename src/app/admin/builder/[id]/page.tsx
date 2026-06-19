/**
 * 管理画面: ページビルダー（③ 配線 / UIは②の Builder）
 *
 * Server Component:
 *   1. pageRepository.getById でページ取得（無ければ notFound()）
 *   2. ②の Builder（Client Component）へ pageId / pageTitle / initialLayout(=draftLayout)
 *      および Server Action（save / publish）を渡す。
 *
 * Server Action の受け渡し（Next.js 16 / use-server.md 準拠）:
 *   BuilderProps の契約は saveAction(layout) / publishAction() で pageId を取らないため、
 *   ここでインラインの `'use server'` 関数として pageId を束縛し、③の actions.ts に委譲する。
 *   インライン Server Function は Client Component へ prop として安全に渡せる。
 *
 * 注: params は Next.js 16 では Promise。await して解決する。
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Builder } from '@/components/builder/Builder';
import { pageRepository } from '@/server/pageStore';
import { savePageLayout, publishPage, updatePageMeta } from '@/server/actions';
import type { PageLayout } from '@/lib/blocks/types';

export const metadata: Metadata = {
  title: 'ページビルダー',
};

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await pageRepository.getById(id);

  if (!page) {
    notFound();
  }

  // pageId を束縛したインライン Server Function（③ actions.ts に委譲）。
  // BuilderProps の契約（saveAction(layout) / publishAction()）に一致させる。
  async function saveAction(layout: PageLayout): Promise<{ ok: boolean }> {
    'use server';
    return savePageLayout(id, layout);
  }

  async function publishAction(): Promise<{ ok: boolean }> {
    'use server';
    return publishPage(id);
  }

  // ページ設定（タイトル・SEO説明文）の保存。id を束縛し updatePageMeta に委譲。
  async function metaAction(meta: {
    title: string;
    description: string;
  }): Promise<{ ok: boolean }> {
    'use server';
    return updatePageMeta(id, meta);
  }

  return (
    <Builder
      pageId={page.id}
      pageTitle={page.title}
      initialDescription={page.description ?? ''}
      initialLayout={page.draftLayout}
      saveAction={saveAction}
      publishAction={publishAction}
      metaAction={metaAction}
    />
  );
}
