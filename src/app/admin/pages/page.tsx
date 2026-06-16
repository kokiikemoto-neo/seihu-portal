/**
 * 管理画面: ページ一覧（③ システム系 / 見た目の詳細は②）
 *
 * pageRepository.list() で全ページを取得し、各ページのビルダーへのリンクを表示する。
 * Server Component（データ取得をサーバーで実行）。最小実装。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { pageRepository } from '@/server/pageStore';

export const metadata: Metadata = {
  title: 'ページ一覧',
};

export default async function AdminPagesListPage() {
  const pages = await pageRepository.list();

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ページ一覧</h1>
      <p className="mt-2 text-sm">
        編集したいページを選択してください。ビルダーで配置を編集・保存・公開できます。
      </p>

      {pages.length === 0 ? (
        <p className="mt-6">ページがまだありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pages.map((page) => (
            <li key={page.id} className="rounded border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{page.title}</p>
                  <p className="text-sm">
                    /{page.slug} ・ 状態: {page.status === 'published' ? '公開中' : '下書き'}
                  </p>
                </div>
                <Link
                  href={`/admin/builder/${page.id}`}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground underline-offset-2 hover:underline"
                >
                  ビルダーで編集
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
