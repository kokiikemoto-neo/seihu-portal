'use client';
/**
 * spacer ブロックの表示・編集UI（② UI担当）
 *
 * - `SpacerRender`: size に応じた縦余白のみを作る装飾なしの要素。
 *   レイアウト調整専用で意味を持たないため `aria-hidden` とする。
 * - `SpacerEditor`: size（sm / md / lg / xl）の選択UI（ラジオ）。視覚的に
 *   どの程度の余白かを比較できるようプレビューバーを併記。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * 絵文字不使用（SVG）。
 */
import type React from 'react';
import type { SpacerProps } from '@/lib/blocks/definitions';

type SpacerSize = SpacerProps['size'];

/** size ごとの高さ（トークン由来のスケールに対応）。 */
const SIZE_HEIGHT: Record<SpacerSize, string> = {
  sm: 'h-4', // 16px (--space-md)
  md: 'h-8', // 32px (--space-xl)
  lg: 'h-12', // 48px (--space-2xl)
  xl: 'h-16', // 64px (--space-3xl)
};

const SIZE_OPTIONS: { value: SpacerSize; label: string; px: string }[] = [
  { value: 'sm', label: '小', px: '16px' },
  { value: 'md', label: '中', px: '32px' },
  { value: 'lg', label: '大', px: '48px' },
  { value: 'xl', label: '特大', px: '64px' },
];

/* =============================================================================
   公開表示（Render）
   余白のみ。装飾・コンテンツなし。支援技術には不要なので aria-hidden。
   ============================================================================ */
export const SpacerRender: React.FC<{ props: SpacerProps }> = ({ props }) => {
  const height = SIZE_HEIGHT[props.size] ?? SIZE_HEIGHT.md;
  return <div data-block="spacer" data-size={props.size} aria-hidden="true" className={height} />;
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
export const SpacerEditor: React.FC<{
  props: SpacerProps;
  onChange: (next: SpacerProps) => void;
}> = ({ props, onChange }) => {
  return (
    <div data-block-editor="spacer" className="space-y-3">
      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          余白のサイズ
        </legend>

        <div
          role="radiogroup"
          aria-label="余白のサイズ"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {SIZE_OPTIONS.map((opt) => {
            const selected = props.size === opt.value;
            return (
              <label
                key={opt.value}
                className={`focus-within:ring-[3px] focus-within:ring-accent/30 flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 p-3 transition-colors duration-200 ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="spacer-size"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange({ ...props, size: opt.value })}
                  className="sr-only"
                />
                {/* 余白量を視覚化するプレビューバー（装飾） */}
                <span
                  aria-hidden="true"
                  className={`w-full rounded bg-secondary ${SIZE_HEIGHT[opt.value]}`}
                />
                <span className="font-sans text-sm font-semibold text-foreground">
                  {opt.label}
                </span>
                <span className="font-sans text-xs text-muted-foreground tabular-nums">
                  {opt.px}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};
