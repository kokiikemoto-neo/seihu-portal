'use client';
/**
 * breadcrumb ブロックの表示・編集UI（② UI担当）
 *
 * - `BreadcrumbRender`: 階層ナビゲーション。`<nav aria-label="パンくず">` + `<ol>`、
 *   href がある項目はリンク（next/link）、href が無い／末尾の項目は現在地として
 *   `aria-current="page"` を付け、区切りの「>」は装飾（aria-hidden）。
 * - `BreadcrumbEditor`: items（label / href?）の追加・削除・編集UI。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * 絵文字不使用（SVG区切り）。
 */
import type React from 'react';
import Link from 'next/link';
import type { BreadcrumbProps } from '@/lib/blocks/definitions';

type BreadcrumbItem = BreadcrumbProps['items'][number];

/** 区切り（シェブロン）。装飾なので aria-hidden。 */
const Separator: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="h-4 w-4 shrink-0 text-muted-foreground"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const BreadcrumbRender: React.FC<{ props: BreadcrumbProps }> = ({ props }) => {
  const { items } = props;

  if (items.length === 0) return null;

  return (
    <nav
      data-block="breadcrumb"
      aria-label="パンくず"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-5xl px-6 py-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            // 末尾、もしくは href 未設定は「現在地」として非リンク表示。
            const isCurrent = isLast || !item.href;
            return (
              <li key={i} className="flex items-center gap-x-2">
                {i > 0 ? <Separator /> : null}
                {isCurrent ? (
                  <span
                    aria-current="page"
                    className="font-sans text-sm font-semibold text-foreground"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href as string}
                    className="focus-ring rounded-sm font-sans text-sm text-link underline-offset-2 transition-colors duration-200 hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

export const BreadcrumbEditor: React.FC<{
  props: BreadcrumbProps;
  onChange: (next: BreadcrumbProps) => void;
}> = ({ props, onChange }) => {
  const updateItem = (index: number, patch: Partial<BreadcrumbItem>) => {
    const items = props.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ ...props, items });
  };

  const addItem = () => {
    const items: BreadcrumbItem[] = [
      ...props.items,
      { label: '新しい階層', href: '' },
    ];
    onChange({ ...props, items });
  };

  const removeItem = (index: number) => {
    const items = props.items.filter((_, i) => i !== index);
    onChange({ ...props, items });
  };

  return (
    <div data-block-editor="breadcrumb" className="space-y-5">
      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          階層項目（{props.items.length}件）
        </legend>
        <p className="font-sans text-xs text-muted-foreground">
          先頭から末尾の順に表示されます。末尾の項目は現在地として扱われ、リンク先を空にすると現在地表示になります。
        </p>

        {props.items.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">
            項目はまだありません。下のボタンで追加できます。
          </p>
        ) : (
          <ul className="space-y-3">
            {props.items.map((item, i) => {
              const isLast = i === props.items.length - 1;
              return (
                <li
                  key={i}
                  className="rounded-md border border-border bg-surface-muted/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-xs font-semibold text-muted-foreground">
                      項目 {i + 1}
                      {isLast ? '（現在地）' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label={`項目 ${i + 1}「${item.label}」を削除`}
                      className="focus-ring inline-flex items-center justify-center gap-1 rounded-md border border-destructive/40 bg-transparent px-2.5 py-1.5 font-sans text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10 cursor-pointer min-h-[44px] min-w-[44px]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      削除
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`breadcrumb-label-${i}`}
                      className="font-sans text-sm font-semibold block text-foreground"
                    >
                      ラベル
                    </label>
                    <input
                      id={`breadcrumb-label-${i}`}
                      type="text"
                      value={item.label}
                      placeholder="例: くらしの手続き"
                      onChange={(e) => updateItem(i, { label: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`breadcrumb-href-${i}`}
                      className="font-sans text-sm font-semibold block text-foreground"
                    >
                      リンク先（任意・現在地は空）
                    </label>
                    <input
                      id={`breadcrumb-href-${i}`}
                      type="text"
                      value={item.href ?? ''}
                      placeholder="例: /kurashi"
                      onChange={(e) => updateItem(i, { href: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={addItem}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary bg-transparent px-4 py-2.5 font-sans font-semibold text-foreground transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          階層を追加
        </button>
      </fieldset>
    </div>
  );
};
