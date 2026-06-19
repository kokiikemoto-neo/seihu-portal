# フェーズ3D — SEO / メタデータ（分担契約）

公開ポータルとして、検索エンジン・SNS共有に適したメタデータを整える。

実装範囲:
1. 公開ページの `generateMetadata`（title / description / canonical / OGP / Twitter）
2. `app/sitemap.ts`（公開ページのサイトマップ）・`app/robots.ts`（/admin 除外）
3. 既定メタ（`metadataBase`・サイト名・OGP既定）を layout に
4. ビルダーに「ページ設定」（title・SEO説明文の編集）

①完了済み: `Page.description`（SEO説明文, nullable）を types.ts / Prisma / リポジトリ / 入力型に追加。`NEXT_PUBLIC_SITE_URL`（.env / .env.example）追加。`PageRepository` の `update` は `description` を受ける。

## 契約: BuilderProps（②が定義、③が渡す）
```ts
export interface BuilderProps {
  pageId: string;
  pageTitle: string;
  initialDescription: string;          // NEW: page.description ?? ''
  initialLayout: PageLayout;
  saveAction: (layout: PageLayout) => Promise<{ ok: boolean }>;
  publishAction: () => Promise<{ ok: boolean }>;
  metaAction: (meta: { title: string; description: string }) => Promise<{ ok: boolean }>; // NEW
}
```

## ③ システム系（`src/app/`・`src/server/`）
- `src/server/seo.ts`（新規）: `deriveDescription(layout: PageLayout): string` … layout から本文テキスト（hero.description / richtext.body / notice 等）を拾い、約120字に整形して返す（メタ説明の自動生成フォールバック）。`SITE_NAME` 定数なども必要なら定義。
- `src/server/actions.ts`: `updatePageMeta(pageId: string, meta: { title: string; description: string }): Promise<{ ok: boolean }>` を追加（`pageRepository.update` に title/description を渡す。空 description は `null` 保存可）。成功で `revalidatePath('/admin/pages')`・`revalidatePath('/')`・該当公開パスを revalidate。
- `src/app/(public)/[...slug]/page.tsx`: `export async function generateMetadata({ params })` を追加。
  - 公開ページ取得→無ければ `{ title: 'ページが見つかりません' }` 等（本文は既存どおり notFound）。
  - title = page.title（layout の template で「| Seihu Portal」が付く）、description = `page.description ?? deriveDescription(publishedLayout)`、`alternates.canonical` = `/<slug>`、`openGraph`（title/description/url/type:'website'/locale:'ja_JP'/siteName）、`twitter`（card:'summary_large_image'）。robots は published のみ index。
- `src/app/sitemap.ts`（新規, `MetadataRoute.Sitemap`）: `pageRepository.list()` の published を URL 化（`${SITE_URL}/<slug>`、lastModified=updatedAt）＋トップ `/`。SITE_URL は `process.env.NEXT_PUBLIC_SITE_URL`。
- `src/app/robots.ts`（新規, `MetadataRoute.Robots`）: allow `/`、disallow `/admin`、`sitemap` を指定。
- `src/app/admin/builder/[id]/page.tsx`: Builder に `initialDescription={page.description ?? ''}` と `metaAction`（inline `'use server'` で id を束縛し `updatePageMeta(id, meta)` に委譲）を渡す。
- `src/components/`・`src/lib/`・Prisma関連は触らない。Next 16 の `generateMetadata`/`MetadataRoute`/`sitemap`/`robots` 仕様を `node_modules/next/dist/docs/` で確認。

## ② UI担当（`src/app/layout.tsx`・`src/components/`）
- `src/app/layout.tsx`: `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')` を metadata に追加。既定 `openGraph`（siteName 'Seihu Portal'、locale 'ja_JP'、type 'website'）と `twitter`（card 'summary_large_image'）を追加。既存の title テンプレ・description は維持。
- ビルダーの「ページ設定」UI:
  - `src/components/builder/PageSettings.tsx`（`'use client'`, 新規）: title・SEO説明文（description）を編集するパネル。`export interface PageSettingsProps { initialTitle: string; initialDescription: string; metaAction: (meta:{title:string;description:string})=>Promise<{ok:boolean}> }`。説明文は120字程度の目安カウント、保存中ローディング、成功/失敗を `aria-live`。label必須・focus-ring・44px。
  - `src/components/builder/Builder.tsx`: `BuilderProps` を上記契約に更新（`initialDescription`・`metaAction` 追加）。ヘッダ付近に「ページ設定」を開くボタン or セクションを設け `PageSettings` を表示。既存の保存/公開導線は維持。
- `src/lib/`・`src/server/`・`src/app/(public)`・`src/app/admin` は触らない。

## 共通
- Next.js 16: 実装前に `node_modules/next/dist/docs/` 確認（metadata / generateMetadata / sitemap / robots / Server Actions）。
- git は実行しない（①が統合・型/lint/build・スクショ確認）。
