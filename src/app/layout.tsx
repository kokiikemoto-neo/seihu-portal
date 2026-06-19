import type { Metadata, Viewport } from "next";
import { Lexend, Source_Sans_3, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

/**
 * フォント定義（next/font/google で自己ホスト・レイアウトシフト無し）
 * - 見出し: Lexend（可変フォント）
 * - 本文(欧文): Source Sans 3（可変フォント）
 * - 本文(和文): Noto Sans JP（日本語グリフ）
 * いずれも CSS 変数として globals.css の @theme に接続する。
 */
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

// Noto Sans JP は日本語サブセット。preload を避け（巨大なため）、swap で後追い適用。
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  // OGP/canonical 等の相対URLを絶対URLへ解決するための基準。
  // 環境変数 NEXT_PUBLIC_SITE_URL（③が .env に追加）が無ければローカルにフォールバック。
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Seihu Portal — 政府機関ポータル",
    template: "%s | Seihu Portal",
  },
  description:
    "各種手続き・サービス・お知らせをまとめてご案内する政府機関ポータルサイトです。",
  applicationName: "Seihu Portal",
  authors: [{ name: "Seihu Portal" }],
  robots: { index: true, follow: true },
  // 既定のOGP。公開ページ側（③ generateMetadata）が title/description/url を上書きする。
  openGraph: {
    siteName: "Seihu Portal",
    locale: "ja_JP",
    type: "website",
  },
  // 既定の Twitter/X カード。large image を基本とする。
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ユーザーのズームを禁止しない（a11y）。テーマカラーはモードに追従。
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${lexend.variable} ${sourceSans.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* スキップリンク: キーボード/SR利用者が本文へ直接移動できる */}
        <a href="#main-content" className="skip-link">
          本文へスキップ
        </a>
        {children}
      </body>
    </html>
  );
}
