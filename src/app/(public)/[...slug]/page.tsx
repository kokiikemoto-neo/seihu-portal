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
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageRenderer from '@/lib/blocks/PageRenderer';
import { ensureBlocksRegistered } from '@/lib/blocks/definitions';
import { pageRepository } from '@/server/pageStore';
import { SITE_NAME, deriveDescription } from '@/server/seo';

/**
 * 公開ページのメタデータを動的生成する（Next.js 16: params は Promise）。
 *
 * - published かつ publishedLayout があるページのみ index 対象。
 * - 取得できない／未公開なら最小限のメタ（noindex）を返す。本文の notFound は
 *   既存のページ本体側で行う（ここでは notFound しない）。
 * - description は page.description（手動設定）を優先し、未設定なら
 *   deriveDescription で本文から自動生成する。
 * - canonical / openGraph.url は metadataBase（layout で設定）に対する相対パス
 *   `/<slug>` で指定する。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join('/');
  const page = await pageRepository.getBySlug(slugPath);

  if (!page || page.status !== 'published' || !page.publishedLayout) {
    return {
      title: 'ページが見つかりません',
      robots: { index: false, follow: false },
    };
  }

  const description =
    page.description ?? deriveDescription(page.publishedLayout);
  const canonicalPath = `/${slugPath}`;

  return {
    title: page.title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: page.title,
      description,
      url: canonicalPath,
      type: 'website',
      locale: 'ja_JP',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

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
