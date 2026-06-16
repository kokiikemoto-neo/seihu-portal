'use client';
/**
 * notice ブロック（③ 定義 / ② 表示）
 * お知らせ・緊急情報のリストを表示する。
 *
 * 'use client' 指定の理由: Editor が onChange を持つため。
 */
import type React from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '../registry';

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

// TODO(②UI): 見た目はUI担当が後で実装。素のプレースホルダ。
const Render: React.FC<{ props: NoticeProps }> = ({ props }) => {
  return (
    <section data-block="notice">
      <h2>{props.heading}</h2>
      <ul>
        {props.items.map((item, i) => (
          <li key={i} data-level={item.level}>
            <time>{item.date}</time>{' '}
            {item.href ? <a href={item.href}>{item.title}</a> : <span>{item.title}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
};

// TODO(②UI): 見た目・項目編集UI（追加/削除/並び替え）はUI担当が後で実装。
const Editor: React.FC<{ props: NoticeProps; onChange: (next: NoticeProps) => void }> = ({
  props,
  onChange,
}) => {
  return (
    <div data-block-editor="notice">
      <label>
        セクション見出し
        <input
          value={props.heading}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
        />
      </label>
      {/* TODO(②UI): items の行ごとの編集（date/title/href/level）と追加/削除/並び替えUIは未実装。 */}
      <p>登録件数: {props.items.length}</p>
    </div>
  );
};

export const noticeBlock: BlockDefinition<NoticeProps> = {
  type: 'notice',
  label: 'お知らせリスト',
  schema: noticeSchema,
  defaultProps,
  Render,
  Editor,
};
