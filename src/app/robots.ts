/**
 * robots.txt（③ システム系, Next.js 16: app/robots.ts）
 *
 * 公開面（`/`）はクロール許可、管理画面（`/admin`）はクロール除外。
 * サイトマップの場所も明示する。
 *
 * SITE_URL は環境変数 `NEXT_PUBLIC_SITE_URL`（未設定時は開発用 localhost）。
 */
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
