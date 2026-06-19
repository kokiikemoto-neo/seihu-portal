/**
 * SEO ユーティリティ（③ システム系）
 *
 * 公開ページのメタ説明文（description）を、ページ本文の配置（PageLayout）から
 * 自動生成するためのフォールパックを提供する。
 *
 * description が未設定（null）のページでも、本文テキスト（hero.description /
 * richtext.body / notice 等）から意味のある説明文を組み立て、検索結果・OGP に
 * 適した約120字のスニペットを返す。
 *
 * 注: props は各ブロック定義（①が管理する型）に従うが、ここでは PageLayout を
 * 横断的に走査するため、props は unknown 経由で安全に参照する（型ガード）。
 */
import type { PageLayout } from '@/lib/blocks/types';

/** サイト名（OGP / タイトルテンプレ等で利用）。 */
export const SITE_NAME = 'Seihu Portal';

/** description フォールバックの目安文字数。 */
const MAX_DESCRIPTION_LENGTH = 120;

/** unknown が文字列かを判定する型ガード。 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** unknown が配列かを判定する型ガード。 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** unknown がプレーンオブジェクト（Record）かを判定する型ガード。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** props から指定キーの文字列を安全に取り出す（無ければ undefined）。 */
function pickString(props: unknown, key: string): string | undefined {
  if (!isRecord(props)) return undefined;
  const value = props[key];
  return isNonEmptyString(value) ? value : undefined;
}

/**
 * 1つのブロックから「本文として拾えるテキスト」を抽出する。
 * 各ブロックの props 形（hero / richtext / notice / faq 等）に応じて
 * 説明に向くフィールドを優先的に集める。未知のブロックは無視する。
 */
function extractTextFromBlock(type: string, props: unknown): string[] {
  const texts: string[] = [];

  switch (type) {
    case 'hero': {
      // 機関名・キャッチコピー・補足説明の順で意味が強い。
      const headline = pickString(props, 'headline');
      const description = pickString(props, 'description');
      if (headline) texts.push(headline);
      if (description) texts.push(description);
      break;
    }
    case 'richtext': {
      // 見出しより本文を優先（本文が説明として有用）。
      const heading = pickString(props, 'heading');
      const body = pickString(props, 'body');
      if (heading) texts.push(heading);
      if (body) texts.push(body);
      break;
    }
    case 'notice': {
      // セクション見出し＋各お知らせの見出しを拾う。
      const heading = pickString(props, 'heading');
      if (heading) texts.push(heading);
      if (isRecord(props) && isArray(props.items)) {
        for (const item of props.items) {
          const title = pickString(item, 'title');
          if (title) texts.push(title);
        }
      }
      break;
    }
    case 'faq': {
      const heading = pickString(props, 'heading');
      if (heading) texts.push(heading);
      if (isRecord(props) && isArray(props.items)) {
        for (const item of props.items) {
          const question = pickString(item, 'question');
          if (question) texts.push(question);
        }
      }
      break;
    }
    case 'emergency-banner': {
      const title = pickString(props, 'title');
      const message = pickString(props, 'message');
      if (title) texts.push(title);
      if (message) texts.push(message);
      break;
    }
    default: {
      // その他のブロック（service-links / contact / org-guide / image / spacer 等）は
      // 説明文に向く本文を持たないため、見出し系のみ拾えれば拾う。
      const heading = pickString(props, 'heading');
      if (heading) texts.push(heading);
      break;
    }
  }

  return texts;
}

/** 連続空白・改行を1スペースに正規化し、前後を trim する。 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * PageLayout から本文テキストを拾い、約120字のメタ説明文に整形して返す。
 *
 * - ブロックを上から順に走査し、説明に向くテキストを連結。
 * - 空白・改行を正規化。
 * - 120字を超える場合は120字目までに切り詰め、末尾に省略記号「…」を付ける。
 * - 拾えるテキストが無い場合は空文字を返す（呼び出し側で既定値にフォールバック可）。
 *
 * @param layout 公開ページの配置（publishedLayout を想定）
 * @returns 約120字に整形した説明文（無ければ空文字）
 */
export function deriveDescription(layout: PageLayout): string {
  const collected: string[] = [];

  for (const block of layout) {
    const texts = extractTextFromBlock(block.type, block.props);
    for (const text of texts) {
      const normalized = normalizeWhitespace(text);
      if (normalized) collected.push(normalized);
    }
    // 十分なテキストが集まったら早期終了（120字を超えれば切り詰めるため）。
    if (collected.join(' ').length >= MAX_DESCRIPTION_LENGTH) break;
  }

  const joined = normalizeWhitespace(collected.join(' '));
  if (joined.length <= MAX_DESCRIPTION_LENGTH) {
    return joined;
  }
  // 120字目までで切り、末尾の半端な空白を除いて省略記号を付ける。
  return `${joined.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}…`;
}
