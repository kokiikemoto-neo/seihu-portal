/**
 * サイトマップ（③ システム系, Next.js 16: app/sitemap.ts）
 *
 * 公開中（published）の全ページと、トップ `/` をサイトマップに含める。
 * 検索エンジンのクロール効率を高めるためのもの。
 *
 * URL は `${SITE_URL}/<slug>` 形式。SITE_URL は環境変数
 * `NEXT_PUBLIC_SITE_URL`（未設定時は開発用 http://localhost:3000）。
 */
import type { MetadataRoute } from 'next';
import { pageRepository } from '@/server/pageStore';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await pageRepository.list();
  const published = pages.filter(
    (page) => page.status === 'published' && page.publishedLayout,
  );

  const pageEntries: MetadataRoute.Sitemap = published.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: new Date(page.updatedAt),
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
    ...pageEntries,
  ];
}
