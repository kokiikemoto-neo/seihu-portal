/**
 * hero ブロック定義（③ システム系）
 * 機関名・キャッチコピー・主要導線（CTA）を表示するページ先頭の見せ場。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/HeroBlock）
 *
 * 依存方向:
 *   - definition → component は「実行時 import」（HeroRender/HeroEditor を BlockDefinition に接続）
 *   - component → definition は `import type` のみ（②が HeroProps を型参照）
 *   よって循環する「実行時」依存は生じない。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { HeroRender, HeroEditor } from '@/components/blocks/HeroBlock';

/** hero の主要導線（CTAボタン）1件 */
const heroCtaSchema = z.object({
  label: z.string().min(1, 'ボタン名を入力してください'),
  href: z.string().min(1, 'リンク先を入力してください'),
});

/** hero ブロックの props スキーマ */
export const heroSchema = z.object({
  /** 機関名（例: 〇〇省 / 〇〇市） */
  organization: z.string().min(1, '機関名を入力してください'),
  /** キャッチコピー（見出し） */
  headline: z.string().min(1, 'キャッチコピーを入力してください'),
  /** 補足説明（任意） */
  description: z.string().default(''),
  /** 主要導線（最大3件想定。空配列可） */
  ctas: z.array(heroCtaSchema).default([]),
});

export type HeroProps = z.infer<typeof heroSchema>;

const defaultProps: HeroProps = {
  organization: '〇〇省',
  headline: 'くらしに役立つ手続きとお知らせ',
  description: '各種手続き・申請・相談窓口へのご案内です。',
  ctas: [
    { label: '手続きを探す', href: '/tetsuzuki' },
    { label: 'お問い合わせ', href: '/contact' },
  ],
};

export const heroBlock: BlockDefinition<HeroProps> = {
  type: 'hero',
  label: 'ヒーロー（機関名・キャッチ・導線）',
  schema: heroSchema,
  defaultProps,
  Render: HeroRender,
  Editor: HeroEditor,
};
