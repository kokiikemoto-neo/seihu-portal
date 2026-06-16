'use client';
/**
 * hero ブロックの表示・編集UI（② UI担当）
 *
 * - `HeroRender`: 公開ページ用の見た目（デザイントークン適用、WCAG AAA）。
 * - `HeroEditor`: ビルダーの編集UI（機関名・headline・description・ctas の追加/削除/編集）。
 *
 * props 型は ③ の定義から `import type` で取得（実行時依存を作らない）。
 * 見た目は MASTER.md（Accessible & Ethical）準拠。絵文字アイコン不使用（SVG）。
 */
import type React from 'react';
import type { HeroProps } from '@/lib/blocks/definitions';

/** hero の CTA 1件の型（HeroProps.ctas の要素）。 */
type HeroCta = HeroProps['ctas'][number];

/* =============================================================================
   公開表示（Render）
   政府サイトらしい信頼感のあるヒーロー。primary 帯の上に機関名・大見出し・補足、
   主要導線（最大想定3件）を accent / outline ボタンで提示。
   ============================================================================ */
export const HeroRender: React.FC<{ props: HeroProps }> = ({ props }) => {
  const { organization, headline, description, ctas } = props;

  return (
    <section
      data-block="hero"
      aria-label={organization ? `${organization} ヒーロー` : 'ヒーロー'}
      className="bg-primary text-primary-foreground"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16 lg:py-20">
        {organization ? (
          <p className="font-sans text-base font-semibold tracking-wide opacity-90">
            {organization}
          </p>
        ) : null}

        <h1 className="font-heading text-3xl font-bold leading-tight mt-2 md:text-4xl">
          {headline}
        </h1>

        {description ? (
          <p className="font-sans text-lg leading-relaxed mt-4 max-w-2xl opacity-95">
            {description}
          </p>
        ) : null}

        {ctas.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-4">
            {ctas.map((cta, i) => {
              // 先頭を主要CTA（accent塗り）、以降をアウトライン（副次）として階層を表現。
              const isPrimary = i === 0;
              return (
                <a
                  key={`${cta.href}-${i}`}
                  href={cta.href || '#'}
                  className={
                    isPrimary
                      ? 'focus-ring inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground no-underline shadow-md transition-colors duration-200 hover:bg-accent-hover cursor-pointer min-h-[44px]'
                      : 'focus-ring inline-flex items-center justify-center rounded-md border-2 border-primary-foreground/60 bg-transparent px-6 py-3 font-sans font-semibold text-primary-foreground no-underline transition-colors duration-200 hover:bg-primary-foreground/10 cursor-pointer min-h-[44px]'
                  }
                >
                  {cta.label}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */

/** 共通: ラベル付きテキスト入力。 */
const Field: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}> = ({ id, label, value, onChange, placeholder, multiline, hint }) => {
  const inputClass =
    'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="font-sans text-sm font-semibold block text-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {hint ? <p className="font-sans text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
};

export const HeroEditor: React.FC<{
  props: HeroProps;
  onChange: (next: HeroProps) => void;
}> = ({ props, onChange }) => {
  const updateCta = (index: number, patch: Partial<HeroCta>) => {
    const ctas = props.ctas.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ ...props, ctas });
  };

  const addCta = () => {
    const ctas: HeroCta[] = [...props.ctas, { label: '新しい導線', href: '/' }];
    onChange({ ...props, ctas });
  };

  const removeCta = (index: number) => {
    const ctas = props.ctas.filter((_, i) => i !== index);
    onChange({ ...props, ctas });
  };

  return (
    <div data-block-editor="hero" className="space-y-5">
      <Field
        id="hero-organization"
        label="機関名"
        value={props.organization}
        onChange={(v) => onChange({ ...props, organization: v })}
        placeholder="例: 〇〇省 / 〇〇市"
      />
      <Field
        id="hero-headline"
        label="キャッチコピー（大見出し）"
        value={props.headline}
        onChange={(v) => onChange({ ...props, headline: v })}
        placeholder="例: くらしに役立つ手続きとお知らせ"
      />
      <Field
        id="hero-description"
        label="補足説明"
        value={props.description}
        onChange={(v) => onChange({ ...props, description: v })}
        placeholder="ヒーローの補足テキスト（任意）"
        multiline
      />

      {/* CTA（主要導線）の編集 */}
      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          主要導線（ボタン）
        </legend>
        <p className="font-sans text-xs text-muted-foreground">
          先頭のボタンが主要CTA（強調表示）になります。最大3件を推奨します。
        </p>

        {props.ctas.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">
            導線はまだありません。下のボタンで追加できます。
          </p>
        ) : (
          <ul className="space-y-3">
            {props.ctas.map((cta, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-surface-muted/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-semibold text-muted-foreground">
                    導線 {i + 1}
                    {i === 0 ? '（主要CTA）' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCta(i)}
                    aria-label={`導線 ${i + 1}「${cta.label}」を削除`}
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
                <Field
                  id={`hero-cta-label-${i}`}
                  label="ボタン名"
                  value={cta.label}
                  onChange={(v) => updateCta(i, { label: v })}
                  placeholder="例: 手続きを探す"
                />
                <Field
                  id={`hero-cta-href-${i}`}
                  label="リンク先"
                  value={cta.href}
                  onChange={(v) => updateCta(i, { href: v })}
                  placeholder="例: /tetsuzuki"
                />
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addCta}
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
          導線を追加
        </button>
      </fieldset>
    </div>
  );
};
