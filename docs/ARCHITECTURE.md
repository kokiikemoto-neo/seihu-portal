# アーキテクチャ — Seihu Portal ページビルダー

政府機関ポータルを、**管理画面上で「どこに何を配置するか」を設計できるページビルダー**として構築する。本番運用・拡張性・アクセシビリティを前提とする。

## 全体像

```
┌─────────────────────────────────────────────────────────────┐
│  管理画面 /admin                                              │
│   ├─ ページ一覧・作成                                          │
│   └─ ビルダー  [ブロック一覧] → [ドラッグ&ドロップ配置] →     │
│                [プロパティ編集] → [プレビュー] → 保存/公開      │
│         （UI/UX = ②、保存/公開ロジック = ③）                  │
├─────────────────────────────────────────────────────────────┤
│  公開サイト /(public)                                         │
│   └─ Renderer: ページJSON(published) → ブロックを順に描画      │
│         （描画エンジン = ③、各ブロックの見た目 = ②）           │
├─────────────────────────────────────────────────────────────┤
│  データ層  Prisma → SQLite(開発) / Postgres(本番)             │
│   Page { id, slug, title, status, draftLayout, publishedLayout }│
└─────────────────────────────────────────────────────────────┘
```

## コア概念

### 1. ブロック (Block)
ページを構成する再利用可能な部品。政府ポータル想定の初期ブロック例:

- `hero` — 機関名・キャッチ・主要導線
- `notice` — お知らせ/緊急情報リスト
- `service-links` — 手続き・サービスへのリンク集（グリッド）
- `richtext` — 見出し・本文
- `faq` — よくある質問（アコーディオン）
- `contact` — 問い合わせ先カード
- `image` / `spacer` — 画像・余白

各ブロックは2つの責務に分離する:

| 部分 | 内容 | 担当 |
|------|------|------|
| **定義** | `type` 名、props の zod スキーマ、デフォルト値 | ③ システム系 |
| **表示** | Renderer用コンポーネント、編集パネルUI | ② UI担当 |

これらを**ブロックレジストリ**で結合する。

### 2. ブロックレジストリ
```ts
// src/lib/blocks/types.ts （①が管理する共有契約）
export type BlockType = 'hero' | 'notice' | 'service-links' | 'richtext' | 'faq' | 'contact' | 'image' | 'spacer';

export interface BlockInstance<T = unknown> {
  id: string;          // インスタンス固有ID
  type: BlockType;     // ブロック種別
  props: T;            // ブロック固有のプロパティ
}

export type PageLayout = BlockInstance[];   // 配置 = ブロックの順序付き配列

export interface BlockDefinition<T> {
  type: BlockType;
  schema: ZodType<T>;            // ③: バリデーション
  defaultProps: T;               // ③
  label: string;                 // 一覧表示名
  Render: React.FC<{ props: T }>;          // ②: 公開表示
  Editor: React.FC<{ props: T; onChange: (p: T) => void }>; // ②: 編集UI
}
```
> レジストリにより、ブロック追加＝「定義＋表示」を1つ登録するだけで、ビルダー・レンダラ双方に反映される。

### 3. ページとレイアウト
- ページの「配置」は `PageLayout`（`BlockInstance[]`）として JSON で保存。
- `draftLayout`（編集中）と `publishedLayout`（公開中）を分離。公開操作で draft→published にコピー。
- 公開サイトは `publishedLayout` のみ描画。

### 4. レンダリングエンジン（③）
`<PageRenderer layout={layout} />` が各 `BlockInstance` をレジストリ参照で対応コンポーネントに解決して順に描画。未知のtypeは安全にスキップ。

## ディレクトリ構成（予定）

```
src/
  app/
    (public)/[...slug]/page.tsx   # 公開ページ（②見た目 / ③データ取得）
    admin/
      pages/                      # ページ一覧・作成（③ロジック / ②UI）
      builder/[id]/               # ビルダー画面（②UI / ③保存API）
    api/                          # ③ API Routes（必要に応じ Server Actions）
  components/                     # ② 共有UI・各ブロックのRender/Editor
  lib/
    blocks/
      types.ts                    # ① 共有契約
      registry.ts                 # ③ 登録、②③が部品を提供
      definitions/                # 各ブロック定義（③スキーマ + ②表示）
  server/                         # ③ 永続化・サービス層
  styles/                         # ② トークン・グローバルCSS
prisma/                           # ③ スキーマ・マイグレーション
design-system/seihu-portal/       # MASTER.md（デザイン Source of Truth）
```

## デザインシステム（MASTER.md 由来）

- スタイル: **Accessible & Ethical**（WCAG AAA、高コントラスト、16px+本文）
- 色: Primary `#0F172A` / Accent `#0369A1` / Background `#F8FAFC`（詳細は MASTER.md）
- フォント: 見出し **Lexend** / 本文 **Source Sans 3**（日本語フォントは②が別途選定: 例 Noto Sans JP）
- 回避: 過度な装飾 / 低コントラスト / 過剰なモーション / AI風の紫ピンクグラデ

## 技術選定メモ（③が確定）

- ドラッグ&ドロップ: `@dnd-kit`（アクセシブル、キーボード対応）を第一候補
- バリデーション: `zod`
- 永続化: `Prisma` + SQLite（開発）→ Postgres（本番）
- ビルダー状態管理: 軽量なら React state、複雑化したら `zustand`
- いずれも導入前に Next.js 16 の作法（`node_modules/next/dist/docs/`）を確認

## フェーズ計画

1. **基盤**（①③）: ブロック型・レジストリ・PageRenderer・最小の永続化（まずインメモリ/JSONでも可→Prisma）
2. **公開表示**（②③）: 2〜3ブロックのRender実装＋トークン適用＋公開ページ描画
3. **ビルダー MVP**（②③）: ブロック追加・並び替え・プロパティ編集・保存
4. **公開フロー**（③）: draft/published 分離・公開操作
5. **本番化**: 認証・権限、Postgres、監査ログ、SEO/メタ、パフォーマンス
