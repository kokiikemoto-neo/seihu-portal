# フェーズ2 — ページビルダーMVP（②③並行作業の契約）

目的: ブロックを**追加・並び替え・編集**して**保存・公開**し、公開ページに反映されるまでの一連を動かす。
①が以下のファイル所有権と型契約を確定したので、②③はこの境界を守り、**互いのファイルを編集しない**こと（gitコミットは①が統合後に行う）。

## ファイル所有権

### ② UI担当（`src/components/` のみ）
- `src/components/blocks/HeroBlock.tsx` / `NoticeBlock.tsx` / `RichtextBlock.tsx`
  各ファイルは **Render と Editor の2つを named export**:
  ```ts
  import type { HeroProps } from '@/lib/blocks/definitions';
  export const HeroRender: React.FC<{ props: HeroProps }> = ...        // 公開表示（トークン適用）
  export const HeroEditor: React.FC<{ props: HeroProps; onChange: (p: HeroProps) => void }> = ... // 編集UI
  ```
  （Notice/Richtext も同様に `Notice*` `Richtext*`）。props型は `import type` で③の定義から取得（実行時依存を作らない）。
- `src/components/builder/Builder.tsx`（`'use client'`）— ビルダー本体。**この型を export**:
  ```ts
  import type { PageLayout } from '@/lib/blocks/types';
  export interface BuilderProps {
    pageId: string;
    pageTitle: string;
    initialLayout: PageLayout;
    saveAction: (layout: PageLayout) => Promise<{ ok: boolean }>;   // ③のServer Action
    publishAction: () => Promise<{ ok: boolean }>;                  // ③のServer Action
  }
  export function Builder(props: BuilderProps): React.ReactElement
  ```
  - ブロック追加パレット・並び替え（`@dnd-kit/sortable`、**キーボード操作対応必須**）・プロパティ編集パネルを実装。
  - 編集パネルは `getBlockDefinition(type).Editor` と `defaultProps`、パレットは `getAllBlockDefinitions()`（`@/lib/blocks/registry`）を利用。
  - 配下の補助コンポーネントは `src/components/builder/` に自由に追加してよい。
- ②は `src/lib/`・`src/server/`・`src/app/` を編集しない。

### ③ システム系（`src/lib/` `src/server/` `src/app/` のルート/アクション）
- `src/lib/blocks/definitions/*.tsx` を**リファクタ**: インラインの素Render/Editorを削除し、`@/components/blocks/*` の `HeroRender`/`HeroEditor` 等を import して `BlockDefinition.Render`/`Editor` に接続。schema・defaultProps・props型(`HeroProps`等)のexportは維持。
  - 注意: definition→component は実行時import、component→definition は `import type` のみ。循環実行依存を作らない。
- `src/server/actions.ts`（`'use server'`）: `savePageLayout(pageId, layout): Promise<{ok}>`、`publishPage(pageId): Promise<{ok}>`。`pageRepository` を使用。
- `src/app/admin/pages/page.tsx`: ページ一覧（最小でよい。一覧＋ビルダーへのリンク）。
- `src/app/admin/builder/[id]/page.tsx`（Server Component）: repoからPage取得→ `<Builder pageId pageTitle initialLayout saveAction publishAction />` に**Server Actionを渡して**描画（`import { Builder } from '@/components/builder/Builder'`、型は契約どおり）。
- `src/app/(public)/[...slug]/page.tsx`: slugで公開ページ取得→ `publishedLayout` を `<PageRenderer />` で描画。未公開/不存在は `notFound()`。`ensureBlocksRegistered()` を確実に呼ぶ。
- **デモページを1件シード**（in-memoryリポジトリに初期データ）: slug例 `home`、hero+notice+richtext を含む下書き。動作確認用。
- ③は `src/components/` を編集しない。

## 統合（①）
両者完了後、①が `npx tsc --noEmit` → `npm run lint` → `npm run build` → `npm run dev` で動作確認 → コミット(`[UI]`/`[SYS]`)→push。

## 共通ルール（再掲）
- Next.js 16: 実装前に `node_modules/next/dist/docs/` 確認（Server Actions、Client/Server境界、dynamic route、`notFound`）。
- デザインは `ui-ux-pro-max` 起点、MASTER.md準拠、WCAG AAA、絵文字アイコン禁止。
- gitは実行しない（①が統合）。
