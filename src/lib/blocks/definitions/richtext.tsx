/**
 * richtext ブロック定義（③ システム系）
 * 見出し＋本文の汎用テキストブロック。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/RichtextBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 * 注: body はプレーンテキスト。HTML/Markdown 描画方針（サニタイズ含む）は②の見た目実装で扱う。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { RichtextRender, RichtextEditor } from '@/components/blocks/RichtextBlock';

/** richtext ブロックの props スキーマ */
export const richtextSchema = z.object({
  /** 見出し（任意） */
  heading: z.string().default(''),
  /** 見出しレベル（②が h2〜h4 等に対応付け） */
  headingLevel: z.enum(['h2', 'h3', 'h4']).default('h2'),
  /** 本文（プレーンテキスト。改行区切り） */
  body: z.string().default(''),
});

export type RichtextProps = z.infer<typeof richtextSchema>;

const defaultProps: RichtextProps = {
  heading: '見出し',
  headingLevel: 'h2',
  body: 'ここに本文を入力します。複数行に対応します。',
};

export const richtextBlock: BlockDefinition<RichtextProps> = {
  type: 'richtext',
  label: 'テキスト（見出し＋本文）',
  schema: richtextSchema,
  defaultProps,
  Render: RichtextRender,
  Editor: RichtextEditor,
};
