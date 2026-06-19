'use client';
/**
 * faq ブロックの表示・編集UI（② UI担当）
 *
 * - `FaqRender`: 質問／回答のアコーディオン。ネイティブな `<details>/<summary>` を
 *   用い、キーボード操作・スクリーンリーダー対応を標準機能で担保する。
 *   開閉アイコンは group-open で回転（reduced-motion は globals.css で抑制）。
 * - `FaqEditor`: heading と items（question / answer）の追加・削除・編集UI。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * 絵文字不使用（SVG）。
 */
import type React from 'react';
import type { FaqProps } from '@/lib/blocks/definitions';

type FaqItem = FaqProps['items'][number];

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const FaqRender: React.FC<{ props: FaqProps }> = ({ props }) => {
  const { heading, items } = props;

  return (
    <section
      data-block="faq"
      aria-labelledby="faq-heading"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        <h2
          id="faq-heading"
          className="font-heading text-2xl font-semibold border-b border-border pb-3"
        >
          {heading}
        </h2>

        {items.length === 0 ? (
          <p className="font-sans text-base text-muted-foreground mt-6">
            よくある質問はまだありません。
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-border bg-surface text-surface-foreground shadow-sm"
              >
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 font-heading text-lg font-semibold transition-colors duration-200 hover:bg-muted/50 min-h-[44px] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="font-heading text-lg font-bold text-accent"
                    >
                      Q
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="font-heading text-lg font-bold text-muted-foreground"
                    >
                      A
                    </span>
                    <p className="font-sans text-base leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
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

export const FaqEditor: React.FC<{
  props: FaqProps;
  onChange: (next: FaqProps) => void;
}> = ({ props, onChange }) => {
  const updateItem = (index: number, patch: Partial<FaqItem>) => {
    const items = props.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ ...props, items });
  };

  const addItem = () => {
    const items: FaqItem[] = [
      ...props.items,
      { question: '新しい質問', answer: '' },
    ];
    onChange({ ...props, items });
  };

  const removeItem = (index: number) => {
    const items = props.items.filter((_, i) => i !== index);
    onChange({ ...props, items });
  };

  return (
    <div data-block-editor="faq" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="faq-heading-input"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          セクション見出し
        </label>
        <input
          id="faq-heading-input"
          type="text"
          value={props.heading}
          placeholder="例: よくあるご質問"
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          質問項目（{props.items.length}件）
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
                    aria-label={`項目 ${i + 1}「${item.question}」を削除`}
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
                    htmlFor={`faq-question-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    質問
                  </label>
                  <input
                    id={`faq-question-${i}`}
                    type="text"
                    value={item.question}
                    onChange={(e) => updateItem(i, { question: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`faq-answer-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    回答
                  </label>
                  <textarea
                    id={`faq-answer-${i}`}
                    value={item.answer}
                    rows={3}
                    placeholder="質問への回答を入力"
                    onChange={(e) => updateItem(i, { answer: e.target.value })}
                    className={`${inputClass} resize-y`}
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
          質問を追加
        </button>
      </fieldset>
    </div>
  );
};
