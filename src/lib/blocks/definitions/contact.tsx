/**
 * contact ブロック定義（③ システム系）
 * 問い合わせ先（窓口・担当部署・連絡先）をカード形式で表示する。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/ContactBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { ContactRender, ContactEditor } from '@/components/blocks/ContactBlock';

/** contact ブロックの props スキーマ（詳細項目は任意） */
export const contactSchema = z.object({
  /** カード見出し（窓口名など） */
  heading: z.string().default('お問い合わせ先'),
  /** 担当部署（任意） */
  department: z.string().optional(),
  /** 電話番号（任意。②が tel: リンク化） */
  tel: z.string().optional(),
  /** メールアドレス（任意。②が mailto: リンク化） */
  email: z.string().optional(),
  /** 住所（任意） */
  address: z.string().optional(),
  /** 受付時間（任意） */
  hours: z.string().optional(),
  /** 補足（任意） */
  note: z.string().optional(),
});

export type ContactProps = z.infer<typeof contactSchema>;

const defaultProps: ContactProps = {
  heading: 'お問い合わせ先',
  department: '市民課 窓口サービス係',
  tel: '03-1234-5678',
  email: 'shimin@example.lg.jp',
  address: '〒100-0001 東京都千代田区千代田1-1 市役所本庁舎1階',
  hours: '平日 午前8時30分〜午後5時15分（土日祝日・年末年始を除く）',
  note: 'お問い合わせの際は、手続き名と氏名をお知らせください。',
};

export const contactBlock: BlockDefinition<ContactProps> = {
  type: 'contact',
  label: '問い合わせ先',
  schema: contactSchema,
  defaultProps,
  Render: ContactRender,
  Editor: ContactEditor,
};
