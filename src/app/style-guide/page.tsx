"use client";

import { useState } from "react";

/**
 * スタイルガイド（/style-guide）
 * 実装済みデザイントークンの可視化ページ。
 * - カラーパレット（用途・CSS変数名・コントラスト目安）
 * - タイポグラフィスケール（Lexend / Source Sans 3 + Noto Sans JP）
 * - スペーシングスケール
 * - ボタン各状態（hover / focus / disabled）
 * - フォーカスリング / フォーム / バッジ
 * デザイン判断は MASTER.md（Accessible & Ethical）に準拠。
 */

type Swatch = {
  name: string;
  varName: string;
  bg: string;
  fg?: string;
  note: string;
  contrast?: string;
};

const semanticSwatches: Swatch[] = [
  {
    name: "Background",
    varName: "--background",
    bg: "var(--background)",
    fg: "var(--foreground)",
    note: "ページ背景",
    contrast: "対 Foreground 17:1 (AAA)",
  },
  {
    name: "Surface",
    varName: "--surface",
    bg: "var(--surface)",
    fg: "var(--surface-foreground)",
    note: "カード/パネル面",
  },
  {
    name: "Primary",
    varName: "--primary",
    bg: "var(--primary)",
    fg: "var(--primary-foreground)",
    note: "主要・ヘッダ",
    contrast: "対 On 17:1 (AAA)",
  },
  {
    name: "Secondary",
    varName: "--secondary",
    bg: "var(--secondary)",
    fg: "var(--secondary-foreground)",
    note: "副次要素",
    contrast: "対 On 9.6:1 (AAA)",
  },
  {
    name: "Accent / CTA",
    varName: "--accent",
    bg: "var(--accent)",
    fg: "var(--accent-foreground)",
    note: "主要導線・リンク",
    contrast: "対 On 5.7:1 (AA)",
  },
  {
    name: "Muted",
    varName: "--muted",
    bg: "var(--muted)",
    fg: "var(--muted-foreground)",
    note: "弱い背景・補助",
    contrast: "対 Fg 7.5:1 (AAA)",
  },
  {
    name: "Destructive",
    varName: "--destructive",
    bg: "var(--destructive)",
    fg: "var(--destructive-foreground)",
    note: "エラー/危険",
    contrast: "対 On 4.8:1 (AA)",
  },
  {
    name: "Success",
    varName: "--success",
    bg: "var(--success)",
    fg: "var(--success-foreground)",
    note: "成功",
    contrast: "対 On 4.6:1 (AA)",
  },
  {
    name: "Warning",
    varName: "--warning",
    bg: "var(--warning)",
    fg: "var(--warning-foreground)",
    note: "警告",
    contrast: "対 On 4.9:1 (AA)",
  },
  {
    name: "Border",
    varName: "--border",
    bg: "var(--border)",
    fg: "#020617",
    note: "境界線（非テキスト 3:1 目標）",
  },
];

const spacing: { token: string; value: string }[] = [
  { token: "xs", value: "4px" },
  { token: "sm", value: "8px" },
  { token: "md", value: "16px" },
  { token: "lg", value: "24px" },
  { token: "xl", value: "32px" },
  { token: "2xl", value: "48px" },
  { token: "3xl", value: "64px" },
];

const typeScale: {
  label: string;
  cls: string;
  sample: string;
  meta: string;
}[] = [
  {
    label: "Display (4xl)",
    cls: "font-heading text-4xl font-bold",
    sample: "信頼できる行政サービス",
    meta: "Lexend / 48px",
  },
  {
    label: "見出し H1 (3xl)",
    cls: "font-heading text-3xl font-semibold",
    sample: "暮らしの手続き案内",
    meta: "Lexend / 36px",
  },
  {
    label: "見出し H2 (2xl)",
    cls: "font-heading text-2xl font-semibold",
    sample: "各種証明書の発行",
    meta: "Lexend / 28px",
  },
  {
    label: "見出し H3 (xl)",
    cls: "font-heading text-xl font-semibold",
    sample: "オンライン申請について",
    meta: "Lexend / 22px",
  },
  {
    label: "リード (lg)",
    cls: "font-sans text-lg",
    sample: "重要なお知らせを分かりやすくお伝えします。",
    meta: "Source Sans 3 + Noto Sans JP / 18px",
  },
  {
    label: "本文 (base)",
    cls: "font-sans text-base",
    sample:
      "本文の既定サイズは16pxです。行間を1.7に設定し、日本語の長文でも読みやすさを確保しています。The quick brown fox.",
    meta: "Source Sans 3 + Noto Sans JP / 16px",
  },
  {
    label: "補助 (sm)",
    cls: "font-sans text-sm text-muted-foreground",
    sample: "補足説明や注釈に使用します（14px）。",
    meta: "Source Sans 3 / 14px",
  },
];

function SectionHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <h2
      id={id}
      className="font-heading text-2xl font-semibold mb-6 pb-2 border-b border-border"
    >
      {children}
    </h2>
  );
}

export default function StyleGuidePage() {
  const [dark, setDark] = useState(false);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.classList.toggle("light", !next);
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      {/* ヘッダ */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-sans text-sm opacity-90">Seihu Portal</p>
            <h1 className="font-heading text-3xl font-bold">
              デザインシステム / スタイルガイド
            </h1>
            <p className="font-sans text-base opacity-90 mt-1">
              Accessible &amp; Ethical — WCAG AAA を目標とした政府ポータル向けトークン
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={dark}
            className="focus-ring inline-flex items-center gap-2 rounded-md border-2 border-primary-foreground/40 bg-transparent px-4 py-2.5 font-sans font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-foreground/10 cursor-pointer min-h-[44px]"
          >
            {/* Heroicons: sun / moon（SVG, 絵文字不使用） */}
            {dark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.591ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.591 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.591ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.591 1.591Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {dark ? "ライトモード" : "ダークモード"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 space-y-16">
        {/* カラーパレット */}
        <section aria-labelledby="colors">
          <SectionHeading id="colors">カラーパレット（セマンティック）</SectionHeading>
          <p className="font-sans text-base text-muted-foreground mb-6">
            ライト/ダーク両対応。各色は CSS 変数で定義し、Tailwind の{" "}
            <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded-sm">
              bg-*
            </code>{" "}
            /{" "}
            <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded-sm">
              text-*
            </code>{" "}
            ユーティリティから参照できます。
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semanticSwatches.map((s) => (
              <li
                key={s.varName}
                className="rounded-lg border border-border overflow-hidden shadow-sm"
              >
                <div
                  className="h-24 flex items-end p-3"
                  style={{ background: s.bg, color: s.fg }}
                >
                  <span className="font-heading font-semibold">{s.name}</span>
                </div>
                <div className="bg-surface text-surface-foreground p-3 space-y-1">
                  <code className="font-mono text-sm block">{s.varName}</code>
                  <p className="font-sans text-sm text-muted-foreground">
                    {s.note}
                  </p>
                  {s.contrast && (
                    <p className="font-sans text-xs font-medium text-foreground">
                      {s.contrast}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* タイポグラフィ */}
        <section aria-labelledby="typography">
          <SectionHeading id="typography">タイポグラフィスケール</SectionHeading>
          <div className="space-y-6">
            {typeScale.map((t) => (
              <div
                key={t.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 items-baseline border-b border-border pb-5"
              >
                <div className="font-sans text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t.label}</p>
                  <p>{t.meta}</p>
                </div>
                <p className={t.cls}>{t.sample}</p>
              </div>
            ))}
          </div>
        </section>

        {/* スペーシング */}
        <section aria-labelledby="spacing">
          <SectionHeading id="spacing">スペーシングスケール</SectionHeading>
          <ul className="space-y-3">
            {spacing.map((sp) => (
              <li key={sp.token} className="flex items-center gap-4">
                <code className="font-mono text-sm w-28 shrink-0">
                  --space-{sp.token}
                </code>
                <span className="font-sans text-sm w-16 shrink-0 text-muted-foreground">
                  {sp.value}
                </span>
                <span
                  className="h-5 bg-accent rounded-sm"
                  style={{ width: `var(--space-${sp.token})` }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ボタン状態 */}
        <section aria-labelledby="buttons">
          <SectionHeading id="buttons">ボタンの各状態</SectionHeading>
          <p className="font-sans text-base text-muted-foreground mb-6">
            最小タッチターゲット 44×44px、可視フォーカスリング、150–300ms のトランジション。
            <span className="font-medium text-foreground">
              {" "}
              キーボードで Tab すると focus-visible リングを確認できます。
            </span>
          </p>

          <div className="space-y-8">
            <div>
              <p className="font-sans text-sm font-semibold mb-3">
                Primary（CTA / アクセント）
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="focus-ring inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground shadow-md transition-colors duration-200 hover:bg-accent-hover cursor-pointer min-h-[44px]"
                >
                  申請をはじめる
                </button>
                <span className="font-sans text-sm text-muted-foreground">
                  hover で <code className="font-mono">--accent-hover</code> に
                </span>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground opacity-50 cursor-not-allowed min-h-[44px]"
                >
                  申請をはじめる
                </button>
                <span className="font-sans text-sm text-muted-foreground">
                  disabled
                </span>
              </div>
            </div>

            <div>
              <p className="font-sans text-sm font-semibold mb-3">
                Secondary（アウトライン）
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="focus-ring inline-flex items-center justify-center rounded-md border-2 border-primary bg-transparent px-6 py-3 font-sans font-semibold text-foreground transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px]"
                >
                  詳しく見る
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-md border-2 border-border bg-transparent px-6 py-3 font-sans font-semibold text-muted-foreground opacity-60 cursor-not-allowed min-h-[44px]"
                >
                  詳しく見る
                </button>
                <span className="font-sans text-sm text-muted-foreground">
                  disabled
                </span>
              </div>
            </div>

            <div>
              <p className="font-sans text-sm font-semibold mb-3">
                Destructive（破壊的操作）
              </p>
              <button
                type="button"
                className="focus-ring inline-flex items-center justify-center rounded-md bg-destructive px-6 py-3 font-sans font-semibold text-destructive-foreground shadow-md transition-opacity duration-200 hover:opacity-90 cursor-pointer min-h-[44px]"
              >
                削除する
              </button>
            </div>
          </div>
        </section>

        {/* フォーカスリング & フォーム */}
        <section aria-labelledby="focus">
          <SectionHeading id="focus">フォーカスリング / フォーム</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="font-sans text-sm font-semibold">
                フォーカスリング例（3px / offset 2px）
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#focus"
                  className="text-link underline underline-offset-2 font-medium"
                >
                  リンクのフォーカス
                </a>
                <button
                  type="button"
                  className="focus-ring rounded-md bg-surface border border-border px-4 py-2.5 font-sans cursor-pointer min-h-[44px]"
                >
                  ボタンのフォーカス
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label
                htmlFor="demo-input"
                className="font-sans text-sm font-semibold block"
              >
                テキスト入力
              </label>
              <input
                id="demo-input"
                type="text"
                placeholder="例: 住民票の写し"
                className="w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]"
              />
              <p className="font-sans text-sm text-muted-foreground">
                境界線 <code className="font-mono">--input</code>、フォーカスで
                <code className="font-mono"> --accent</code> リング。
              </p>
            </div>
          </div>
        </section>

        {/* シャドウ */}
        <section aria-labelledby="shadows">
          <SectionHeading id="shadows">シャドウ深度</SectionHeading>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {(["sm", "md", "lg", "xl"] as const).map((lv) => (
              <div
                key={lv}
                className="rounded-lg bg-surface text-surface-foreground p-5 text-center font-sans"
                style={{ boxShadow: `var(--shadow-${lv})` }}
              >
                <code className="font-mono text-sm">--shadow-{lv}</code>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="bg-surface-muted border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="font-sans text-sm text-muted-foreground">
            Seihu Portal デザインシステム — Source of Truth:{" "}
            <code className="font-mono">
              design-system/seihu-portal/MASTER.md
            </code>
          </p>
        </div>
      </footer>
    </main>
  );
}
