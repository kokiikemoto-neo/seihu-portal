'use client';
/**
 * richtext ブロック（③ 定義 / ② 表示）
 * 見出し＋本文の汎用テキストブロック。
 *
 * 'use client' 指定の理由: Editor が onChange を持つため。
 *
 * 注: body はプレーンテキスト。HTML/Markdown 描画方針（サニタイズ含む）は
 * ②の見た目実装時に①と相談して決定する（TODO 参照）。
 */
import type React from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '../registry';

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

// TODO(②UI): 見た目はUI担当が後で実装。見出しレベルへのタグ対応・本文整形（改行/リンク化/サニタイズ）も②で。
const Render: React.FC<{ props: RichtextProps }> = ({ props }) => {
  return (
    <section data-block="richtext">
      {props.heading ? <h2 data-level={props.headingLevel}>{props.heading}</h2> : null}
      {props.body
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line, i) => (
          <p key={i}>{line}</p>
        ))}
    </section>
  );
};

// TODO(②UI): 見た目・リッチエディタ化はUI担当が後で実装。最小の編集フォーム。
const Editor: React.FC<{ props: RichtextProps; onChange: (next: RichtextProps) => void }> = ({
  props,
  onChange,
}) => {
  return (
    <div data-block-editor="richtext">
      <label>
        見出し
        <input
          value={props.heading}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
        />
      </label>
      <label>
        見出しレベル
        <select
          value={props.headingLevel}
          onChange={(e) =>
            onChange({ ...props, headingLevel: e.target.value as RichtextProps['headingLevel'] })
          }
        >
          <option value="h2">大見出し (h2)</option>
          <option value="h3">中見出し (h3)</option>
          <option value="h4">小見出し (h4)</option>
        </select>
      </label>
      <label>
        本文
        <textarea
          value={props.body}
          onChange={(e) => onChange({ ...props, body: e.target.value })}
        />
      </label>
    </div>
  );
};

export const richtextBlock: BlockDefinition<RichtextProps> = {
  type: 'richtext',
  label: 'テキスト（見出し＋本文）',
  schema: richtextSchema,
  defaultProps,
  Render,
  Editor,
};
