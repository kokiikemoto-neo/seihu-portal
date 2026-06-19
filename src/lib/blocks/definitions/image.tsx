/**
 * image ブロック定義（③ システム系）
 * 単一画像とキャプションを表示する。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/ImageBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 * 注: src が空のときは Render 側でプレースホルダを表示する想定（②）。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { ImageRender, ImageEditor } from '@/components/blocks/ImageBlock';

/** image ブロックの props スキーマ */
export const imageSchema = z.object({
  /** 画像URL（空のとき Render はプレースホルダ表示） */
  src: z.string().default(''),
  /** 代替テキスト（必須・空可だがアクセシビリティ上は推奨） */
  alt: z.string().default(''),
  /** キャプション（任意。②が figcaption 化） */
  caption: z.string().optional(),
});

export type ImageProps = z.infer<typeof imageSchema>;

const defaultProps: ImageProps = {
  src: '',
  alt: '画像の内容を説明する代替テキスト',
  caption: '画像のキャプション',
};

export const imageBlock: BlockDefinition<ImageProps> = {
  type: 'image',
  label: '画像',
  schema: imageSchema,
  defaultProps,
  Render: ImageRender,
  Editor: ImageEditor,
};
