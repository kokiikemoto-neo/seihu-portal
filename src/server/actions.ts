'use server';
/**
 * ページビルダーの Server Actions（③ システム系）
 *
 * Next.js 16 / React 19 の Server Functions として動作する（`'use server'`）。
 * このファイルの関数は Client Component（②の Builder）からも import して呼び出せる。
 *
 * - savePageLayout: ビルダーの編集中配置を draftLayout として保存
 * - publishPage:    draftLayout を publishedLayout にコピーし status を 'published' に
 *
 * 永続化は pageRepository（PageRepository 抽象）に委譲。実装差し替え時もここは不変。
 * 公開ページのキャッシュ無効化のため、必要に応じて revalidatePath を呼ぶ。
 */
import { revalidatePath } from 'next/cache';
import { pageRepository } from './pageStore';
import type { PageLayout } from '@/lib/blocks/types';

/**
 * 編集中の配置（draftLayout）を保存する。
 * @param pageId 対象ページのID
 * @param layout 保存する配置（BlockInstance[]）
 * @returns 成功可否
 */
export async function savePageLayout(
  pageId: string,
  layout: PageLayout,
): Promise<{ ok: boolean }> {
  const updated = await pageRepository.update(pageId, { draftLayout: layout });
  if (!updated) {
    return { ok: false };
  }
  // ビルダー画面の再取得用に当該ルートを再検証。
  revalidatePath(`/admin/builder/${pageId}`);
  return { ok: true };
}

/**
 * ページを公開する（draftLayout → publishedLayout コピー、status='published'）。
 * @param pageId 対象ページのID
 * @returns 成功可否
 */
export async function publishPage(pageId: string): Promise<{ ok: boolean }> {
  const published = await pageRepository.publish(pageId);
  if (!published) {
    return { ok: false };
  }
  // 公開ページ（[...slug]）とビルダー画面のキャッシュを無効化。
  revalidatePath(`/${published.slug}`);
  revalidatePath(`/admin/builder/${pageId}`);
  return { ok: true };
}
