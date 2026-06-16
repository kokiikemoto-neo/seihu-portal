/**
 * 公開ページ（③ データ取得・配線 / 各ブロックの見た目は②）
 *
 * catch-all ルート `[...slug]`（Next.js 16: params は Promise、slug は string[]）。
 *   1. ブロック定義の登録を保証（ensureBlocksRegistered）
 *   2. slug を "/" 結合して pageRepository.getBySlug で取得
 *   3. status==='published' かつ publishedLayout があれば PageRenderer で描画
 *      それ以外（未公開・不存在）は notFound()
 *
 * <main id="main-content"> でラップ（②のスキップリンク「本文へスキップ」の接続先）。
 */
import { notFound } from 'next/navigation';
import PageRenderer from '@/lib/blocks/PageRenderer';
import { ensureBlocksRegistered } from '@/lib/blocks/definitions';
import { pageRepository } from '@/server/pageStore';

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  // 公開描画前にブロック定義の登録を保証する。
  ensureBlocksRegistered();

  const { slug } = await params;
  const page = await pageRepository.getBySlug(slug.join('/'));

  if (!page || page.status !== 'published' || !page.publishedLayout) {
    notFound();
  }

  return (
    <main id="main-content">
      <PageRenderer layout={page.publishedLayout} />
    </main>
  );
}
