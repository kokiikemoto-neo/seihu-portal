/**
 * spacer ブロック定義（③ システム系）
 * レイアウト調整用の縦余白のみを挿入する（装飾なし）。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/SpacerBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { SpacerRender, SpacerEditor } from '@/components/blocks/SpacerBlock';

/** spacer ブロックの props スキーマ */
export const spacerSchema = z.object({
  /** 余白の大きさ */
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
});

export type SpacerProps = z.infer<typeof spacerSchema>;

const defaultProps: SpacerProps = {
  size: 'md',
};

export const spacerBlock: BlockDefinition<SpacerProps> = {
  type: 'spacer',
  label: '余白',
  schema: spacerSchema,
  defaultProps,
  Render: SpacerRender,
  Editor: SpacerEditor,
};
