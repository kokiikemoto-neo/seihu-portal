/**
 * breadcrumb ブロック定義（③ システム系）
 * 階層ナビゲーション（パンくずリスト）。末尾は現在地（href 無し想定）。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/BreadcrumbBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 * 注: 末尾項目は現在地のため href を省略する想定（aria-current 等のマークアップは②）。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { BreadcrumbRender, BreadcrumbEditor } from '@/components/blocks/BreadcrumbBlock';

/** パンくず項目1件 */
const breadcrumbItemSchema = z.object({
  /** 表示ラベル */
  label: z.string().min(1, 'ラベルを入力してください'),
  /** リンク先（任意。末尾＝現在地は省略想定） */
  href: z.string().optional(),
});

/** breadcrumb ブロックの props スキーマ */
export const breadcrumbSchema = z.object({
  /** パンくず項目（先頭→現在地の順。空配列可） */
  items: z.array(breadcrumbItemSchema).default([]),
});

export type BreadcrumbProps = z.infer<typeof breadcrumbSchema>;

const defaultProps: BreadcrumbProps = {
  items: [
    { label: 'ホーム', href: '/' },
    { label: 'くらしの手続き', href: '/tetsuzuki' },
    { label: '住民票の写しの請求' },
  ],
};

export const breadcrumbBlock: BlockDefinition<BreadcrumbProps> = {
  type: 'breadcrumb',
  label: 'パンくずリスト',
  schema: breadcrumbSchema,
  defaultProps,
  Render: BreadcrumbRender,
  Editor: BreadcrumbEditor,
};
