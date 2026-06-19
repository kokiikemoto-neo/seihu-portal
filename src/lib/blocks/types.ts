/**
 * ブロック共有契約（Source of Truth）
 *
 * このファイルは「① 全体管理」が管理する、UI担当(②)とシステム系(③)の境界となる型定義。
 * ②③はここから import するだけで、勝手に重複定義しないこと。
 * 変更が必要な場合は①に連絡し、ここを更新してから両者に展開する。
 *
 * 設計詳細: docs/ARCHITECTURE.md
 */

/** ページを構成するブロックの種別 */
export type BlockType =
  | 'hero'
  | 'notice'
  | 'emergency-banner'
  | 'service-links'
  | 'richtext'
  | 'faq'
  | 'breadcrumb'
  | 'org-guide'
  | 'contact'
  | 'image'
  | 'spacer';

/** ページ上に配置された1つのブロックインスタンス */
export interface BlockInstance<TProps = Record<string, unknown>> {
  /** インスタンス固有ID（配置のたびに一意に採番） */
  id: string;
  /** ブロック種別 */
  type: BlockType;
  /** ブロック固有のプロパティ（型は各ブロック定義に従う） */
  props: TProps;
}

/** ページの「配置」＝ブロックの順序付き配列 */
export type PageLayout = BlockInstance[];

/** ページの公開状態 */
export type PageStatus = 'draft' | 'published';

/** ページのデータモデル */
export interface Page {
  id: string;
  /** 公開URLのパス（例: "kurashi/tetsuzuki"） */
  slug: string;
  title: string;
  /** SEO用のメタ説明文（検索結果・OGPに使用。未設定なら null = 本文から自動生成） */
  description: string | null;
  status: PageStatus;
  /** 編集中の配置 */
  draftLayout: PageLayout;
  /** 公開中の配置（未公開なら null） */
  publishedLayout: PageLayout | null;
  createdAt: string;
  updatedAt: string;
}
