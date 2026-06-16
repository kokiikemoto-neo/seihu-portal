'use client';
/**
 * notice ブロックの表示・編集UI（② UI担当）
 *
 * - `NoticeRender`: お知らせ/緊急情報リストの公開表示。
 *   重要度 level（normal / important / emergency）を **色だけに依存せず**、
 *   ラベル＋SVGアイコン＋色（accent / destructive トークン）で区別する。
 * - `NoticeEditor`: 項目（items）の追加/削除/編集UI。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 */
import type React from 'react';
import type { NoticeProps } from '@/lib/blocks/definitions';

/** お知らせ1件の型（NoticeProps.items の要素）。 */
type NoticeItem = NoticeProps['items'][number];
type NoticeLevel = NoticeItem['level'];

/** 日付文字列（ISO 8601 想定）を日本語表記に整形。失敗時は元の文字列を返す。 */
function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/** level ごとの表示メタ（ラベル・配色・アイコン）。色だけに頼らずラベルを併記。 */
const LEVEL_META: Record<
  NoticeLevel,
  { label: string; badgeClass: string; Icon: React.FC }
> = {
  normal: {
    label: 'お知らせ',
    // 中立的な情報。muted 面 + 通常テキストで控えめに。
    badgeClass: 'bg-muted text-foreground border border-border',
    Icon: () => (
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
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
  },
  important: {
    // 重要。accent（青）で注意喚起。
    label: '重要',
    badgeClass: 'bg-accent text-accent-foreground',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    ),
  },
  emergency: {
    // 緊急。destructive（赤）で最大限の強調。
    label: '緊急',
    badgeClass: 'bg-destructive text-destructive-foreground',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
};

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const NoticeRender: React.FC<{ props: NoticeProps }> = ({ props }) => {
  const { heading, items } = props;

  return (
    <section
      data-block="notice"
      aria-labelledby="notice-heading"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <h2
          id="notice-heading"
          className="font-heading text-2xl font-semibold border-b border-border pb-3"
        >
          {heading}
        </h2>

        {items.length === 0 ? (
          <p className="font-sans text-base text-muted-foreground mt-6">
            現在お知らせはありません。
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {items.map((item, i) => {
              const meta = LEVEL_META[item.level];
              const isEmphasized = item.level !== 'normal';
              return (
                <li key={i} data-level={item.level} className="py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                      <time
                        dateTime={item.date}
                        className="font-sans text-sm font-medium tabular-nums text-muted-foreground"
                      >
                        {formatDate(item.date)}
                      </time>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${meta.badgeClass}`}
                      >
                        <meta.Icon />
                        {meta.label}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.href ? (
                        <a
                          href={item.href}
                          className={`font-sans text-base leading-relaxed underline-offset-2 hover:underline focus-ring rounded-sm ${
                            isEmphasized
                              ? 'font-semibold text-foreground'
                              : 'text-link'
                          }`}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span
                          className={`font-sans text-base leading-relaxed ${
                            isEmphasized ? 'font-semibold' : ''
                          }`}
                        >
                          {item.title}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const LEVEL_OPTIONS: { value: NoticeLevel; label: string }[] = [
  { value: 'normal', label: 'お知らせ（通常）' },
  { value: 'important', label: '重要' },
  { value: 'emergency', label: '緊急' },
];

const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

export const NoticeEditor: React.FC<{
  props: NoticeProps;
  onChange: (next: NoticeProps) => void;
}> = ({ props, onChange }) => {
  const updateItem = (index: number, patch: Partial<NoticeItem>) => {
    const items = props.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ ...props, items });
  };

  const addItem = () => {
    const today = new Date().toISOString().slice(0, 10);
    const items: NoticeItem[] = [
      ...props.items,
      { date: today, title: '新しいお知らせ', href: '', level: 'normal' },
    ];
    onChange({ ...props, items });
  };

  const removeItem = (index: number) => {
    const items = props.items.filter((_, i) => i !== index);
    onChange({ ...props, items });
  };

  return (
    <div data-block-editor="notice" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="notice-heading-input"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          セクション見出し
        </label>
        <input
          id="notice-heading-input"
          type="text"
          value={props.heading}
          onChange={(e) => onChange({ ...props, heading: e.target.value })}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          お知らせ項目（{props.items.length}件）
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
                    htmlFor={`notice-date-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    日付
                  </label>
                  <input
                    id={`notice-date-${i}`}
                    type="date"
                    value={item.date}
                    onChange={(e) => updateItem(i, { date: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`notice-title-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    見出し
                  </label>
                  <input
                    id={`notice-title-${i}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`notice-href-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    リンク先（任意）
                  </label>
                  <input
                    id={`notice-href-${i}`}
                    type="text"
                    value={item.href}
                    placeholder="例: /news/1"
                    onChange={(e) => updateItem(i, { href: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`notice-level-${i}`}
                    className="font-sans text-sm font-semibold block text-foreground"
                  >
                    重要度
                  </label>
                  <select
                    id={`notice-level-${i}`}
                    value={item.level}
                    onChange={(e) =>
                      updateItem(i, { level: e.target.value as NoticeLevel })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
          お知らせを追加
        </button>
      </fieldset>
    </div>
  );
};
