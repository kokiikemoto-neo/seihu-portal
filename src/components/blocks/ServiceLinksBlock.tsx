'use client';
/**
 * service-links ブロックの表示・編集UI（② UI担当）
 *
 * - `ServiceLinksRender`: 主要な手続き／サービスへのレスポンシブなカードグリッド。
 *   各カード全体がリンク（next/link）。1/2/3 カラムで段階的に増やす。
 * - `ServiceLinksEditor`: heading と items（title / description? / href）の
 *   追加・削除・編集UI。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * カードは hover で shadow を変化（layout-shift しない）。絵文字不使用（SVG）。
 */
import type React from 'react';
import Link from 'next/link';
import type { ServiceLinksProps } from '@/lib/blocks/definitions';

type ServiceLinkItem = ServiceLinksProps['items'][number];

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const ServiceLinksRender: React.FC<{ props: ServiceLinksProps }> = ({
  props,
}) => {
  const { heading, items } = props;

  return (
    <section
      data-block="service-links"
      aria-labelledby="service-links-heading"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <h2
          id="service-links-heading"
          className="font-heading text-2xl font-semibold border-b border-border pb-3"
        >
          {heading}
        </h2>

        {items.length === 0 ? (
          <p className="font-sans text-base text-muted-foreground mt-6">
            リンクはまだありません。
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <li key={`${item.href}-${i}`} className="flex">
                <Link
                  href={item.href || '#'}
                  className="focus-ring group flex w-full flex-col rounded-lg border border-border bg-surface text-surface-foreground p-5 no-underline shadow-sm transition-shadow duration-200 hover:shadow-md min-h-[44px]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-heading text-lg font-semibold leading-snug text-link group-hover:underline underline-offset-2">
                      {item.title}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-accent"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                  {item.description ? (
                    <span className="font-sans text-base leading-relaxed mt-2 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

export const ServiceLinksEditor: React.FC<{
  props: ServiceLinksProps;
  onChange: (next: ServiceLinksProps) => void;
}> = ({ props, onChange }) => {
  const updateItem = (index: number, patch: Partial<ServiceLinkItem>) => {
    const items = props.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ ...props, items });
  };

  const addItem = () => {
    const items: ServiceLinkItem[] = [
      ...props.items,
      { title: '新しいサービス', description: '', href: '/' },
    ];
    onChange({ ...props, items });
  };

  const removeItem = (index: number) => {
    const items = props.items.filter((_, i) => i !== index);
    onChange({ ...props, items });
  };

  return (
    <div data-block-editor="service-links" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="service-links-heading-input"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          セクション見出し
        </label>
        <input
          id="service-links-heading-input"
          type="text"
          value={props.heading}
          placeholder="例: よく使う手続き・サービス"
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          リンク項目（{props.items.length}件）
        </legend>

        {props.items.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">
            項目はまだありません。下のボタンで追加できます。
          </p>
        ) : (
          <ul className="space-y-3">
            {props.items.map((item, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-surface-muted/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-semibold text-muted-foreground">
                    項目 {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label={`項目 ${i + 1}「${item.title}」を削除`}
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
                    htmlFor={`service-title-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    タイトル
                  </label>
                  <input
                    id={`service-title-${i}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`service-description-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    説明（任意）
                  </label>
                  <textarea
                    id={`service-description-${i}`}
                    value={item.description ?? ''}
                    rows={2}
                    placeholder="サービスの簡単な説明"
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`service-href-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    リンク先
                  </label>
                  <input
                    id={`service-href-${i}`}
                    type="text"
                    value={item.href}
                    placeholder="例: /tetsuzuki/jumin-hyo"
                    onChange={(e) => updateItem(i, { href: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </li>
            ))}
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
          サービスを追加
        </button>
      </fieldset>
    </div>
  );
};
