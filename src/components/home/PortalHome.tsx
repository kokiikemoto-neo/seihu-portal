/**
 * トップ入口ハブ（/）の見た目（② UI担当）
 *
 * 政府ポータルらしい信頼感のある入口。Server Component から `pages` を受け取り、
 * - サイトタイトル / 説明（primary 帯のヒーロー）
 * - 公開 / 下書きの件数サマリ
 * - 主要導線カード（ページを編集・作成する → /admin/pages、デザインを見る → /style-guide）
 * - 公開中ページへのリンク一覧（空状態に配慮）
 * を提示する。
 *
 * これは Server Component（'use client' 不要）。内部リンクは next/link の <Link>。
 * デザインは MASTER.md（Accessible & Ethical, WCAG AAA 目標）準拠。絵文字アイコン不使用（インラインSVG）。
 */
import Link from 'next/link';
import type React from 'react';

export interface PortalHomeProps {
  pages: { id: string; slug: string; title: string; status: 'draft' | 'published' }[];
}

/* =============================================================================
   アイコン（Heroicons outline 風 / 絵文字不使用）
   ============================================================================ */

const PencilSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-6 w-6'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const SwatchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-6 w-6'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
    />
  </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-4 w-4'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    className={className ?? 'h-10 w-10'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
    />
  </svg>
);

/* =============================================================================
   サマリ用の小カード（件数表示）
   ============================================================================ */

const SummaryStat: React.FC<{
  label: string;
  count: number;
  tone: 'published' | 'draft' | 'total';
}> = ({ label, count, tone }) => {
  // 件数バッジの色は意味づけ。published=success, draft=warning, total=accent。
  const dotClass =
    tone === 'published'
      ? 'bg-success'
      : tone === 'draft'
        ? 'bg-warning'
        : 'bg-accent';
  return (
    <div className="rounded-lg border border-border bg-surface text-surface-foreground p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden="true" />
        <p className="font-sans text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="font-heading text-3xl font-bold mt-2 tabular-nums">{count}</p>
    </div>
  );
};

/* =============================================================================
   主要導線カード（大きめのCTAカード）
   ============================================================================ */

const NavCard: React.FC<{
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  primary?: boolean;
}> = ({ href, title, description, icon, primary }) => {
  return (
    <Link
      href={href}
      className={
        'focus-ring group flex flex-col gap-4 rounded-xl border p-6 no-underline shadow-md transition-shadow duration-200 hover:shadow-lg cursor-pointer ' +
        (primary
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-surface text-surface-foreground')
      }
    >
      <span
        className={
          'inline-flex h-12 w-12 items-center justify-center rounded-lg ' +
          (primary ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-accent')
        }
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="space-y-1">
        <h3
          className={
            'font-heading text-xl font-semibold ' +
            (primary ? 'text-primary-foreground' : 'text-foreground')
          }
        >
          {title}
        </h3>
        <p
          className={
            'font-sans text-base ' +
            (primary ? 'text-primary-foreground/90' : 'text-muted-foreground')
          }
        >
          {description}
        </p>
      </div>
      <span
        className={
          'mt-auto inline-flex items-center gap-1.5 font-sans text-sm font-semibold ' +
          (primary ? 'text-primary-foreground' : 'text-link')
        }
      >
        開く
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

/* =============================================================================
   本体
   ============================================================================ */

export const PortalHome: React.FC<PortalHomeProps> = ({ pages }) => {
  const total = pages.length;
  const publishedPages = pages.filter((p) => p.status === 'published');
  const draftCount = pages.filter((p) => p.status === 'draft').length;
  const publishedCount = publishedPages.length;

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      {/* ヒーロー（サイトタイトル / 説明） */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-20">
          <p className="font-sans text-sm font-semibold tracking-wide opacity-90">
            Seihu Portal
          </p>
          <h1 className="font-heading text-3xl font-bold leading-tight mt-2 md:text-4xl">
            行政ポータル管理ハブ
          </h1>
          <p className="font-sans text-lg leading-relaxed mt-4 max-w-2xl opacity-95">
            公開ページの確認、ページの作成・編集、デザインシステムの確認を、ここからまとめて行えます。
            アクセシビリティに配慮した、信頼できる行政サービスのための入口です。
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 space-y-14">
        {/* 件数サマリ */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">
            ページの件数サマリ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryStat label="公開中のページ" count={publishedCount} tone="published" />
            <SummaryStat label="下書きのページ" count={draftCount} tone="draft" />
            <SummaryStat label="ページ総数" count={total} tone="total" />
          </div>
        </section>

        {/* 主要導線 */}
        <section aria-labelledby="nav-heading">
          <h2
            id="nav-heading"
            className="font-heading text-2xl font-semibold mb-6 pb-2 border-b border-border"
          >
            主要メニュー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <NavCard
              href="/admin/pages"
              title="ページを編集・作成する"
              description="ページの新規作成・編集・公開・削除を行います。"
              icon={<PencilSquareIcon className="h-6 w-6" />}
              primary
            />
            <NavCard
              href="/style-guide"
              title="デザインを見る"
              description="配色・タイポグラフィなどデザインシステムを確認します。"
              icon={<SwatchIcon className="h-6 w-6" />}
            />
          </div>
        </section>

        {/* 公開中ページ一覧 */}
        <section aria-labelledby="published-heading">
          <h2
            id="published-heading"
            className="font-heading text-2xl font-semibold mb-6 pb-2 border-b border-border"
          >
            公開中のページ
            <span className="font-sans text-base font-normal text-muted-foreground ml-2 tabular-nums">
              （{publishedCount}件）
            </span>
          </h2>

          {total === 0 ? (
            // 空状態: ページが1件もない
            <div className="rounded-xl border border-dashed border-border bg-surface text-center px-6 py-12">
              <span className="inline-flex text-muted-foreground" aria-hidden="true">
                <InboxIcon className="h-10 w-10" />
              </span>
              <p className="font-heading text-lg font-semibold mt-3 text-foreground">
                まだページがありません
              </p>
              <p className="font-sans text-base text-muted-foreground mt-1">
                最初のページを作成して、ポータルを公開しましょう。
              </p>
              <Link
                href="/admin/pages"
                className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground no-underline shadow-md transition-colors duration-200 hover:bg-accent-hover cursor-pointer min-h-[44px]"
              >
                ページを作成する
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          ) : publishedCount === 0 ? (
            // 空状態: ページはあるが公開中が0件
            <div className="rounded-xl border border-dashed border-border bg-surface text-center px-6 py-10">
              <span className="inline-flex text-muted-foreground" aria-hidden="true">
                <InboxIcon className="h-10 w-10" />
              </span>
              <p className="font-heading text-lg font-semibold mt-3 text-foreground">
                公開中のページはありません
              </p>
              <p className="font-sans text-base text-muted-foreground mt-1">
                下書きが{draftCount}件あります。管理画面から公開できます。
              </p>
              <Link
                href="/admin/pages"
                className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary bg-transparent px-6 py-3 font-sans font-semibold text-foreground no-underline transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px]"
              >
                管理画面を開く
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
              {publishedPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/${page.slug}`}
                    className="focus-ring group flex items-center gap-4 px-5 py-4 no-underline transition-colors duration-200 hover:bg-muted cursor-pointer"
                  >
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-accent"
                      aria-hidden="true"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-base font-semibold text-surface-foreground truncate">
                        {page.title}
                      </span>
                      <span className="block font-sans text-sm text-muted-foreground truncate">
                        /{page.slug}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 font-sans text-xs font-semibold text-success"
                    >
                      公開中
                    </span>
                    <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="bg-surface-muted border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="font-sans text-sm text-muted-foreground">
            Seihu Portal — 信頼できる行政サービスのためのポータル管理ハブ
          </p>
        </div>
      </footer>
    </main>
  );
};

export default PortalHome;
