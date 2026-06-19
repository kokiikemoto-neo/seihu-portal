'use server';
/**
 * ページビルダーの Server Actions（③ システム系）
 *
 * Next.js 16 / React 19 の Server Functions として動作する（`'use server'`）。
 * このファイルの関数は Client Component（②の Builder）からも import して呼び出せる。
 *
 * - savePageLayout: ビルダーの編集中配置を draftLayout として保存
 * - publishPage:    draftLayout を publishedLayout にコピーし status を 'published' に
 * - updatePageMeta: ページのタイトル／SEO説明文（description）を更新
 * - createPage:     ページを新規作成（slug/title をバリデーション）
 * - deletePage:     ページを削除
 *
 * 永続化は pageRepository（PageRepository 抽象）に委譲。実装差し替え時もここは不変。
 * 公開ページのキャッシュ無効化のため、必要に応じて revalidatePath を呼ぶ。
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { pageRepository } from './pageStore';
import { prisma } from '@/server/db';
import {
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireUser,
} from '@/server/auth';
import type { PageLayout } from '@/lib/blocks/types';

/* ============================================================
 * 認証（③ 配線 / コアは @/server/auth ①）
 * ============================================================ */

/**
 * ログイン。email で User を引き、パスワードを照合してセッションCookieを発行する。
 *
 * ユーザー列挙を防ぐため、ユーザー不在とパスワード不一致は **同一の汎用エラー** を返す。
 * @param input email / password（平文）
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function login(input: {
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const GENERIC_ERROR = 'メールアドレスまたはパスワードが正しくありません。';
  try {
    const email = input.email?.trim() ?? '';
    const password = input.password ?? '';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // ユーザー不在でも同一の汎用エラー（列挙防止）。
      return { ok: false, error: GENERIC_ERROR };
    }

    const matched = await verifyPassword(password, user.passwordHash);
    if (!matched) {
      return { ok: false, error: GENERIC_ERROR };
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'ログイン処理でエラーが発生しました。' };
  }
}

/**
 * ログアウト。セッションCookieを破棄してログイン画面へリダイレクトする。
 *
 * 注: `redirect` は内部で例外を投げるため try/catch の外で呼ぶ（Next.js 16 / redirect.md 準拠）。
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}

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
  try {
    await requireUser();
  } catch {
    return { ok: false };
  }
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
  try {
    await requireUser();
  } catch {
    return { ok: false };
  }
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
 * ページのメタ情報（タイトル・SEO説明文）を更新する。
 *
 * ビルダーの「ページ設定」から呼ばれる。description が空文字（trim 後）なら
 * `null` を保存し、公開ページでは本文からの自動生成（deriveDescription）に
 * フォールバックさせる。
 *
 * @param pageId 対象ページのID
 * @param meta   title（ページ名）と description（SEO説明文）
 * @returns 成功可否（例外時も `{ ok: false }`）
 */
export async function updatePageMeta(
  pageId: string,
  meta: { title: string; description: string },
): Promise<{ ok: boolean }> {
  try {
    await requireUser();
  } catch {
    return { ok: false };
  }
  try {
    const updated = await pageRepository.update(pageId, {
      title: meta.title,
      description: meta.description.trim() === '' ? null : meta.description,
    });
    if (!updated) {
      return { ok: false };
    }
    // ページ一覧・トップ入口ハブ・該当公開パスのキャッシュを無効化。
    revalidatePath('/admin/pages');
    revalidatePath('/');
    revalidatePath(`/${updated.slug}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
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
    await requireUser();
  } catch {
    return { ok: false, error: 'ログインが必要です。' };
  }
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
  try {
    await requireUser();
  } catch {
    return { ok: false };
  }
  const removed = await pageRepository.remove(pageId);
  if (!removed) {
    return { ok: false };
  }
  // ページ一覧とトップ入口ハブのキャッシュを無効化。
  revalidatePath('/admin/pages');
  revalidatePath('/');
  return { ok: true };
}
