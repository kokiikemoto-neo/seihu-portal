/**
 * faq ブロック定義（③ システム系）
 * 質問／回答をアコーディオン形式で表示するよくある質問。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/FaqBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { FaqRender, FaqEditor } from '@/components/blocks/FaqBlock';

/** よくある質問1件（質問＋回答） */
const faqItemSchema = z.object({
  /** 質問 */
  question: z.string().min(1, '質問を入力してください'),
  /** 回答 */
  answer: z.string().min(1, '回答を入力してください'),
});

/** faq ブロックの props スキーマ */
export const faqSchema = z.object({
  /** セクション見出し */
  heading: z.string().default('よくある質問'),
  /** 質問項目（空配列可） */
  items: z.array(faqItemSchema).default([]),
});

export type FaqProps = z.infer<typeof faqSchema>;

const defaultProps: FaqProps = {
  heading: 'よくある質問',
  items: [
    {
      question: '窓口の受付時間を教えてください。',
      answer: '平日午前8時30分から午後5時15分までです。土日祝日・年末年始はお休みです。',
    },
    {
      question: '各種手続きはオンラインでできますか。',
      answer: '一部の手続きはマイナポータルからオンラインで申請できます。詳しくは各手続きのご案内をご確認ください。',
    },
    {
      question: '必要な持ち物は何ですか。',
      answer: '手続きによって異なります。本人確認書類（マイナンバーカード等）が必要となる場合があります。',
    },
  ],
};

export const faqBlock: BlockDefinition<FaqProps> = {
  type: 'faq',
  label: 'よくある質問',
  schema: faqSchema,
  defaultProps,
  Render: FaqRender,
  Editor: FaqEditor,
};
