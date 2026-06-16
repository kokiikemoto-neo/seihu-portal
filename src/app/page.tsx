/**
 * トップページ `/` — ポータルの入口ハブ（③ システム系 / 見た目は②）
 *
 * pageRepository.list() で全ページを取得し、PortalHome に整形して渡す。
 * Server Component（データ取得をサーバーで実行）。描画の見た目は②の PortalHome に委譲する。
 */
import type { Metadata } from 'next';
import { PortalHome } from '@/components/home/PortalHome';
import type { PortalHomeProps } from '@/components/home/PortalHome';
import { pageRepository } from '@/server/pageStore';

export const metadata: Metadata = {
  title: 'Seihu Portal',
};

export default async function HomePage() {
  const allPages = await pageRepository.list();

  // PortalHomeProps の契約（{ id, slug, title, status } の配列）に整形する。
  const pages: PortalHomeProps['pages'] = allPages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
  }));

  return (
    <main id="main-content">
      <PortalHome pages={pages} />
    </main>
  );
}
