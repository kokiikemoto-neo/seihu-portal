# フェーズ3A — 永続化(Prisma) + 入口ページ + ページ管理（分担契約）

目的:
1. データ永続化を**インメモリ→Prisma+SQLite**へ（本番想定。①が担当）
2. **トップページ `/` を入口（ハブ）化**し、確認を簡単に（②③）
3. **ページの新規作成・削除**を可能に（②③）

①が以下のファイル所有権・契約を確定。②③は境界を守り互いのファイルを編集しない。gitは①が統合後にコミット。

## ① 全体管理（Prisma永続化・toolchain）
- `prisma/schema.prisma`、`src/server/db.ts`（PrismaClient）、`src/server/prismaPageRepository.ts`、`src/server/pageStore.ts` の `pageRepository` を Prisma 実装へ差し替え（**`PageRepository` インターフェースは不変**＝②③に影響なし）。
- マイグレーション・generate・デモページseedは①が実行。
- ②③が完了後に `tsc`/`lint`/`build`/dev で統合検証。

> **重要**: `PageRepository` の形（`list/getById/getBySlug/create/update/remove/publish`、全て async）は変わりません。②③は今まで通り `pageRepository`（`@/server/pageStore`）と Server Actions を使えばよい。

## ③ システム系（`src/app/` ルート・`src/server/actions.ts`）
- `src/server/actions.ts` に追加:
  - `createPage(input: { slug: string; title: string }): Promise<{ ok: boolean; id?: string; error?: string }>` … `pageRepository.create`。slug重複や空はエラーで返す。成功後 `revalidatePath('/admin/pages')` と `revalidatePath('/')`。
  - `deletePage(pageId: string): Promise<{ ok: boolean }>` … `pageRepository.remove`。同様に revalidate。
- `src/app/page.tsx`（**新規・トップ入口ハブ**, Server Component）: `pageRepository.list()` で全ページ取得し、`@/components/home/PortalHome` に渡して描画（公開/下書きの件数、各ページへのリンク等のデータを props で渡す）。
- `src/app/admin/pages/page.tsx`（既存を拡張）: ページ一覧に**新規作成フォーム**（`@/components/admin/CreatePageForm`）と各ページの**削除**（`@/components/admin/DeletePageButton` か、フォーム）を組み込み、`createPage`/`deletePage` を Server Action として渡す。
- `src/components/` は触らない（②）。Prisma関連 `src/server/db.ts`/`prismaPageRepository.ts`/`pageStore.ts`/`prisma/` は触らない（①）。

## ② UI担当（`src/components/` のみ）
- `src/components/home/PortalHome.tsx`: トップ入口ハブの見た目。MASTER.md準拠・WCAG配慮。内容:
  - サイトタイトル/説明、主要導線（**ビルダーを開く=/admin/pages**、**スタイルガイド=/style-guide**）、公開中ページの一覧リンク、下書き数などのサマリ。
  - props 例: `{ pages: { id:string; slug:string; title:string; status:'draft'|'published' }[] }`（③と契約。最終形はこのファイルの export 型を③が参照）。型は `export interface PortalHomeProps { ... }` で export。
- `src/components/admin/CreatePageForm.tsx`（`'use client'`）: slug・title 入力フォーム。`export interface CreatePageFormProps { createAction: (input:{slug:string;title:string}) => Promise<{ok:boolean;id?:string;error?:string}> }`。送信中ローディング、エラー表示、成功でフォームリセット。a11y（label/エラーをaria-live）。
- `src/components/admin/DeletePageButton.tsx`（`'use client'`）: `export interface DeletePageButtonProps { pageId:string; pageTitle:string; deleteAction:(id:string)=>Promise<{ok:boolean}> }`。確認ダイアログ（破壊的操作はdestructive色・分離）。
- `src/lib/`・`src/server/`・`src/app/` は触らない。

## 共通
- Next.js 16: 実装前に `node_modules/next/dist/docs/` を確認（Server Actions、フォーム、`revalidatePath`）。
- デザインは `ui-ux-pro-max` 起点、WCAG配慮、絵文字アイコン禁止、既存トークン再利用。
- gitは実行しない（①が統合）。
