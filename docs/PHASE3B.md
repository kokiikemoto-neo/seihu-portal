# フェーズ3B — 政府固有ブロックの追加（分担契約）

ページビルダーに政府ポータル定番のブロックを4種追加する。既存のブロック方式（定義=③ / 表示・編集UI=②）にそのまま乗る。レジストリ登録で、追加すればビルダーのパレットにも公開描画にも自動で反映される。

追加ブロック（`BlockType` は types.ts に追加済み: `emergency-banner` / `breadcrumb`。`service-links` / `faq` は既存の型を実装）:

| type | 名称 | 用途 |
|------|------|------|
| `emergency-banner` | 緊急情報バナー | 災害・緊急のお知らせを最上部で強く告知 |
| `service-links` | サービス・手続きリンク集 | 主要な手続き/サービスへのカードグリッド |
| `faq` | よくある質問 | 質問/回答のアコーディオン |
| `breadcrumb` | パンくずリスト | 階層ナビゲーション |

## prop 形（①確定。③のschema・②のpropsはこれに一致させる）

```ts
// emergency-banner
interface EmergencyBannerProps {
  level: 'info' | 'warning' | 'emergency';   // 重大度（色・アイコンで区別、色だけに依存しない）
  title: string;
  message: string;
  linkLabel?: string;   // 詳細リンク（任意）
  linkHref?: string;
}

// service-links
interface ServiceLinksProps {
  heading: string;
  items: { title: string; description?: string; href: string }[];   // カードグリッド
}

// faq
interface FaqProps {
  heading: string;
  items: { question: string; answer: string }[];   // アコーディオン
}

// breadcrumb
interface BreadcrumbProps {
  items: { label: string; href?: string }[];   // 末尾は現在地（href無し想定）
}
```

## ③ システム系（`src/lib/blocks/`）
- `src/lib/blocks/definitions/emergency-banner.tsx` / `service-links.tsx` / `faq.tsx` / `breadcrumb.tsx` を新規作成。
  - 各: zod schema（上記prop形に一致）、`defaultProps`、`BlockDefinition`（`Render`/`Editor` は `@/components/blocks/*` から実行時import）、props型を export（`EmergencyBannerProps` 等）。
  - 既存 `hero.tsx` 等と同じ構造・命名規則に合わせる。`type` は上記のリテラル。
- `src/lib/blocks/definitions/index.ts` を編集: `allBlocks` に4ブロックを追加し、各 `*Block` と `*Props` を re-export。
- `src/components/` は触らない。`types.ts` は①管理（編集済み・触らない）。

## ② UI担当（`src/components/blocks/`）
- `src/components/blocks/EmergencyBannerBlock.tsx` / `ServiceLinksBlock.tsx` / `FaqBlock.tsx` / `BreadcrumbBlock.tsx` を新規作成。
  - 各: `*Render`（公開表示）と `*Editor`（編集UI）を named export。props型は `import type { EmergencyBannerProps } from '@/lib/blocks/definitions'`。
  - 命名・実装は既存 `HeroBlock.tsx`/`NoticeBlock.tsx` に合わせる。Renderルートに `data-block="<type>"`。
  - **デザインは `ui-ux-pro-max` 起点**、既存トークン再利用（生hex禁止）、WCAG配慮、絵文字禁止（インラインSVG）。
  - ポイント:
    - emergency-banner: level で色分け（info=accent / warning=warning / emergency=destructive 系トークン）＋アイコン＋ラベル。色だけに依存しない。`role="alert"` 等の適切なセマンティクス。
    - service-links: レスポンシブなカードグリッド（リンクは `next/link`）。
    - faq: アコーディオン（`<details>/<summary>` 推奨でキーボード/SR対応が容易）。
    - breadcrumb: `<nav aria-label="パンくず">` + `<ol>`、末尾は `aria-current="page"`。
  - `*Editor` は配列項目（items / ctas 同様）の追加・削除・編集に対応。
- `src/lib/`・`src/server/`・`src/app/` は触らない。

## 共通
- Next.js 16: 実装前に `node_modules/next/dist/docs/` を確認。
- git は実行しない（①が統合）。型チェック/lint/build は①が実施。
- 既存の hero/notice/richtext と同じ規約（`data-block`、トークン名、focus-ring、44px）を踏襲。
