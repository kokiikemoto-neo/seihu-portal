'use client';
/**
 * hero ブロック（③ 定義 / ② 表示）
 * 機関名・キャッチコピー・主要導線（CTA）を表示するページ先頭の見せ場。
 *
 * 'use client' 指定の理由: Editor が onChange（イベントハンドラ）を持つため。
 * Render はサーバーコンポーネントからも描画可能（client 境界になるだけ）。
 */
import type React from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '../registry';

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

// TODO(②UI): 見た目はUI担当が後で実装。以下は構造確認用の素のプレースホルダ。
const Render: React.FC<{ props: HeroProps }> = ({ props }) => {
  return (
    <section data-block="hero">
      <p>{props.organization}</p>
      <h1>{props.headline}</h1>
      {props.description ? <p>{props.description}</p> : null}
      <ul>
        {props.ctas.map((cta, i) => (
          <li key={i}>
            <a href={cta.href}>{cta.label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
};

// TODO(②UI): 見た目・操作感はUI担当が後で実装。最小の編集フォーム。
const Editor: React.FC<{ props: HeroProps; onChange: (next: HeroProps) => void }> = ({
  props,
  onChange,
}) => {
  return (
    <div data-block-editor="hero">
      <label>
        機関名
        <input
          value={props.organization}
          onChange={(e) => onChange({ ...props, organization: e.target.value })}
        />
      </label>
      <label>
        キャッチコピー
        <input
          value={props.headline}
          onChange={(e) => onChange({ ...props, headline: e.target.value })}
        />
      </label>
      <label>
        補足説明
        <textarea
          value={props.description}
          onChange={(e) => onChange({ ...props, description: e.target.value })}
        />
      </label>
      {/* TODO(②UI): CTA(ctas)の追加/削除/並び替えUIは未実装。 */}
    </div>
  );
};

export const heroBlock: BlockDefinition<HeroProps> = {
  type: 'hero',
  label: 'ヒーロー（機関名・キャッチ・導線）',
  schema: heroSchema,
  defaultProps,
  Render,
  Editor,
};
