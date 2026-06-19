'use client';
/**
 * emergency-banner ブロックの表示・編集UI（② UI担当）
 *
 * - `EmergencyBannerRender`: 災害・緊急のお知らせをページ最上部で強く告知する帯。
 *   level（info / warning / emergency）を **色だけに依存せず**、
 *   ラベル＋SVGアイコン＋色（accent / warning / destructive トークン）で区別する。
 *   緊急度に応じて role を出し分け（emergency=alert, それ以外=region）。
 * - `EmergencyBannerEditor`: level・タイトル・本文・詳細リンク（任意）の編集UI。
 *
 * props 型は ③ の定義から `import type` で取得（実行時依存を作らない）。
 * 見た目は MASTER.md（Accessible & Ethical）/ WCAG AAA 準拠。絵文字不使用（SVG）。
 */
import type React from 'react';
import Link from 'next/link';
import type { EmergencyBannerProps } from '@/lib/blocks/definitions';

type BannerLevel = EmergencyBannerProps['level'];

/**
 * level ごとの表示メタ（ラベル・配色・アイコン）。
 * 色だけに頼らず、ラベル文言とアイコン形状でも重大度を区別する。
 */
const LEVEL_META: Record<
  BannerLevel,
  { label: string; surfaceClass: string; iconWrapClass: string; Icon: React.FC }
> = {
  info: {
    // 情報。accent（青）で落ち着いた注意喚起。
    label: 'お知らせ',
    surfaceClass: 'bg-accent text-accent-foreground',
    iconWrapClass: 'bg-accent-foreground/15',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        className="h-5 w-5"
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
  warning: {
    // 警告。warning（オレンジ）で強めの注意喚起。
    label: '注意',
    surfaceClass: 'bg-warning text-warning-foreground',
    iconWrapClass: 'bg-warning-foreground/15',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        className="h-5 w-5"
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
  emergency: {
    // 緊急。destructive（赤）で最大限の強調。
    label: '緊急',
    surfaceClass: 'bg-destructive text-destructive-foreground',
    iconWrapClass: 'bg-destructive-foreground/15',
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
  },
};

/* =============================================================================
   公開表示（Render）
   緊急度の帯。色＋アイコン＋ラベルで重大度を多重符号化。emergency のみ
   role="alert"（即時アナウンス）、それ以外は role="region" で領域として提示。
   ============================================================================ */
export const EmergencyBannerRender: React.FC<{ props: EmergencyBannerProps }> = ({
  props,
}) => {
  const { level, title, message, linkLabel, linkHref } = props;
  const meta = LEVEL_META[level];
  const hasLink = Boolean(linkLabel && linkHref);

  return (
    <section
      data-block="emergency-banner"
      data-level={level}
      role={level === 'emergency' ? 'alert' : 'region'}
      aria-label={`${meta.label}: ${title}`}
      className={`${meta.surfaceClass}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:gap-4">
        <div
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconWrapClass}`}
        >
          <meta.Icon />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-background/20 px-2.5 py-0.5 font-sans text-xs font-bold tracking-wide">
              {meta.label}
            </span>
            <h2 className="font-heading text-lg font-bold leading-snug">{title}</h2>
          </div>

          {message ? (
            <p className="font-sans text-base leading-relaxed mt-1.5 opacity-95">
              {message}
            </p>
          ) : null}

          {hasLink ? (
            <Link
              href={linkHref as string}
              className="focus-ring inline-flex items-center gap-1.5 rounded-md font-sans text-base font-semibold underline underline-offset-2 mt-2 transition-opacity duration-200 hover:opacity-80 min-h-[44px] [color:inherit]"
            >
              {linkLabel}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

const LEVEL_OPTIONS: { value: BannerLevel; label: string }[] = [
  { value: 'info', label: 'お知らせ（情報・青）' },
  { value: 'warning', label: '注意（警告・オレンジ）' },
  { value: 'emergency', label: '緊急（最重要・赤）' },
];

export const EmergencyBannerEditor: React.FC<{
  props: EmergencyBannerProps;
  onChange: (next: EmergencyBannerProps) => void;
}> = ({ props, onChange }) => {
  return (
    <div data-block-editor="emergency-banner" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="emergency-level"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          重大度
        </label>
        <select
          id="emergency-level"
          value={props.level}
          onChange={(e) =>
            onChange({ ...props, level: e.target.value as BannerLevel })
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
          色だけでなくラベルとアイコンでも重大度を表示します。緊急時は読み上げソフトに即時通知されます。
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="emergency-title"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          タイトル
        </label>
        <input
          id="emergency-title"
          type="text"
          value={props.title}
          placeholder="例: 大雨・洪水警報が発表されました"
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="emergency-message"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          本文
        </label>
        <textarea
          id="emergency-message"
          value={props.message}
          rows={3}
          placeholder="例: 河川の増水にご注意ください。避難情報は防災ページをご確認ください。"
          onChange={(e) => onChange({ ...props, message: e.target.value })}
          className={`${inputClass} resize-y`}
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          詳細リンク（任意）
        </legend>
        <p className="font-sans text-xs text-muted-foreground">
          ラベルとリンク先の両方を入力したときのみ表示されます。
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="emergency-link-label"
            className="font-sans text-sm font-semibold block text-foreground"
          >
            リンクのラベル
          </label>
          <input
            id="emergency-link-label"
            type="text"
            value={props.linkLabel ?? ''}
            placeholder="例: 防災情報の詳細はこちら"
            onChange={(e) => onChange({ ...props, linkLabel: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="emergency-link-href"
            className="font-sans text-sm font-semibold block text-foreground"
          >
            リンク先
          </label>
          <input
            id="emergency-link-href"
            type="text"
            value={props.linkHref ?? ''}
            placeholder="例: /bosai"
            onChange={(e) => onChange({ ...props, linkHref: e.target.value })}
            className={inputClass}
          />
        </div>
      </fieldset>
    </div>
  );
};
