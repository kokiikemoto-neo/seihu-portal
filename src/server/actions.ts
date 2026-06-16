'use server';
/**
 * ページビルダーの Server Actions（③ システム系）
 *
 * Next.js 16 / React 19 の Server Functions として動作する（`'use server'`）。
 * このファイルの関数は Client Component（②の Builder）からも import して呼び出せる。
 *
 * - savePageLayout: ビルダーの編集中配置を draftLayout として保存
 * - publishPage:    draftLayout を publishedLayout にコピーし status を 'published' に
 * - createPage:     ページを新規作成（slug/title をバリデーション）
 * - deletePage:     ページを削除
 *
 * 永続化は pageRepository（PageRepository 抽象）に委譲。実装差し替え時もここは不変。
 * 公開ページのキャッシュ無効化のため、必要に応じて revalidatePath を呼ぶ。
 */
import { revalidatePath } from 'next/cache';
import { pageRepository } from './pageStore';
import type { PageLayout } from '@/lib/blocks/types';

/**
 * slug の形式（公開URLのパスとして使える文字のみ）。
 * 英小文字・数字・ハイフンを `/` で区切ったセグメントを許可する。
 * 例: "kurashi", "kurashi/tetsuzuki"。先頭/末尾の `/`、連続 `/`、大文字、空白は不可。
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

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

/**
 * ページを新規作成する。
 * slug/title の空チェック・slug 形式チェック・slug 重複チェックを行ってから作成する。
 * @param input slug（公開URLのパス）と title（ページ名）
 * @returns 成功可否。成功時は新規ページの id を返す。失敗時は error にメッセージ。
 */
export async function createPage(input: {
  slug: string;
  title: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const slug = input.slug?.trim() ?? '';
    const title = input.title?.trim() ?? '';

    if (!slug) {
      return { ok: false, error: 'スラッグを入力してください。' };
    }
    if (!title) {
      return { ok: false, error: 'タイトルを入力してください。' };
    }
    if (!SLUG_PATTERN.test(slug)) {
      return {
        ok: false,
        error:
          'スラッグは英小文字・数字・ハイフンと、区切りの / のみ使用できます（例: kurashi/tetsuzuki）。',
      };
    }

    const existing = await pageRepository.getBySlug(slug);
    if (existing) {
      return { ok: false, error: `スラッグ「${slug}」は既に使用されています。` };
    }

    const created = await pageRepository.create({ slug, title });

    // ページ一覧とトップ入口ハブのキャッシュを無効化。
    revalidatePath('/admin/pages');
    revalidatePath('/');
    return { ok: true, id: created.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ページの作成に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * ページを削除する。
 * @param pageId 対象ページのID
 * @returns 成功可否
 */
export async function deletePage(pageId: string): Promise<{ ok: boolean }> {
  const removed = await pageRepository.remove(pageId);
  if (!removed) {
    return { ok: false };
  }
  // ページ一覧とトップ入口ハブのキャッシュを無効化。
  revalidatePath('/admin/pages');
  revalidatePath('/');
  return { ok: true };
}
