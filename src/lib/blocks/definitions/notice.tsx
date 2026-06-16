/**
 * notice ブロック定義（③ システム系）
 * お知らせ・緊急情報のリストを表示する。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/NoticeBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { NoticeRender, NoticeEditor } from '@/components/blocks/NoticeBlock';

/** お知らせ1件 */
const noticeItemSchema = z.object({
  /** 日付（ISO 8601 文字列。表示整形は②） */
  date: z.string().min(1, '日付を入力してください'),
  /** 見出し */
  title: z.string().min(1, '見出しを入力してください'),
  /** 詳細ページへのリンク（任意） */
  href: z.string().default(''),
  /** 重要度（緊急情報の強調などに②が利用） */
  level: z.enum(['normal', 'important', 'emergency']).default('normal'),
});

/** notice ブロックの props スキーマ */
export const noticeSchema = z.object({
  /** セクション見出し */
  heading: z.string().default('お知らせ'),
  /** お知らせ項目（空配列可） */
  items: z.array(noticeItemSchema).default([]),
});

export type NoticeProps = z.infer<typeof noticeSchema>;

const defaultProps: NoticeProps = {
  heading: 'お知らせ',
  items: [
    {
      date: '2026-06-16',
      title: '窓口受付時間の変更について',
      href: '/news/1',
      level: 'normal',
    },
    {
      date: '2026-06-10',
      title: '【重要】システムメンテナンスのお知らせ',
      href: '/news/2',
      level: 'important',
    },
  ],
};

export const noticeBlock: BlockDefinition<NoticeProps> = {
  type: 'notice',
  label: 'お知らせリスト',
  schema: noticeSchema,
  defaultProps,
  Render: NoticeRender,
  Editor: NoticeEditor,
};
