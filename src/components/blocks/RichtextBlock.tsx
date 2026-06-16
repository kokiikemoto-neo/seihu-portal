'use client';
/**
 * richtext ブロックの表示・編集UI（② UI担当）
 *
 * - `RichtextRender`: 見出し（headingLevel に対応した h2/h3/h4 タグ）＋本文（改行区切りで段落化）。
 * - `RichtextEditor`: 見出し・見出しレベル・本文の編集UI。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * body はプレーンテキスト。改行で段落に分割し、危険なHTMLは描画しない（XSS安全）。
 */
import type React from 'react';
import type { RichtextProps } from '@/lib/blocks/definitions';

type HeadingLevel = RichtextProps['headingLevel'];

/** headingLevel に応じた見出しタグと見た目（サイズ）を返す。 */
const HEADING_CLASS: Record<HeadingLevel, string> = {
  h2: 'font-heading text-2xl font-semibold',
  h3: 'font-heading text-xl font-semibold',
  h4: 'font-heading text-lg font-semibold',
};

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const RichtextRender: React.FC<{ props: RichtextProps }> = ({ props }) => {
  const { heading, headingLevel, body } = props;
  const HeadingTag = headingLevel; // 'h2' | 'h3' | 'h4' を実タグにマップ

  const paragraphs = body.split('\n').filter((line) => line.trim().length > 0);

  return (
    <section data-block="richtext" className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8 md:py-10">
        {heading ? (
          <HeadingTag className={HEADING_CLASS[headingLevel]}>{heading}</HeadingTag>
        ) : null}

        {paragraphs.length > 0 ? (
          <div className={heading ? 'mt-4 space-y-4' : 'space-y-4'}>
            {paragraphs.map((line, i) => (
              <p key={i} className="font-sans text-base leading-relaxed max-w-2xl">
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

const LEVEL_OPTIONS: { value: HeadingLevel; label: string }[] = [
  { value: 'h2', label: '大見出し (h2)' },
  { value: 'h3', label: '中見出し (h3)' },
  { value: 'h4', label: '小見出し (h4)' },
];

export const RichtextEditor: React.FC<{
  props: RichtextProps;
  onChange: (next: RichtextProps) => void;
}> = ({ props, onChange }) => {
  return (
    <div data-block-editor="richtext" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="richtext-heading"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          見出し（任意）
        </label>
        <input
          id="richtext-heading"
          type="text"
          value={props.heading}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="richtext-level"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          見出しレベル
        </label>
        <select
          id="richtext-level"
          value={props.headingLevel}
          onChange={(e) =>
            onChange({ ...props, headingLevel: e.target.value as HeadingLevel })
          }
          className={`${inputClass} cursor-pointer`}
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="font-sans text-xs text-muted-foreground">
          ページの見出し階層（h2 → h3 → h4）に合わせて選んでください。
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="richtext-body"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          本文
        </label>
        <textarea
          id="richtext-body"
          value={props.body}
          rows={6}
          onChange={(e) => onChange({ ...props, body: e.target.value })}
          className={`${inputClass} resize-y`}
        />
        <p className="font-sans text-xs text-muted-foreground">
          改行で段落が分かれます。空行は無視されます。
        </p>
      </div>
    </div>
  );
};
