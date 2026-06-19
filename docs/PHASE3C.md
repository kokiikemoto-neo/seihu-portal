# フェーズ3C — 定番ブロックの拡充（分担契約）

ページビルダーのブロックを実用レベルに充実させる。4種追加（既存方式に乗る: 定義=③ / 表示・編集UI=②）。

| type | 名称 | 備考 |
|------|------|------|
| `contact` | 問い合わせ先カード | 既存enum・未実装 |
| `org-guide` | 組織案内 | 新規（types.ts追加済み） |
| `image` | 画像 | 既存enum・未実装。`next/image` を `unoptimized` で使用（任意URL対応・ドメイン設定不要） |
| `spacer` | 余白 | 既存enum・未実装。レイアウト調整用 |

## prop 形（①確定。③のschema・②のpropsを一致させる）

```ts
// contact（問い合わせ先カード。詳細は任意）
interface ContactProps {
  heading: string;
  department?: string;   // 担当部署
  tel?: string;
  email?: string;
  address?: string;
  hours?: string;        // 受付時間
  note?: string;         // 補足
}

// org-guide（組織案内）
interface OrgGuideProps {
  heading: string;
  departments: { name: string; description?: string; href?: string }[];
}

// image（画像）
interface ImageProps {
  src: string;           // 画像URL（空のときは Render でプレースホルダ表示）
  alt: string;           // 代替テキスト（必須・空可だが推奨）
  caption?: string;      // キャプション
}

// spacer（余白）
interface SpacerProps {
  size: 'sm' | 'md' | 'lg' | 'xl';
}
```

## ③ システム系（`src/lib/blocks/`）
- 新規定義: `src/lib/blocks/definitions/contact.tsx` / `org-guide.tsx` / `image.tsx` / `spacer.tsx`
  - 各: zod schema（上記prop形に一致）、現実的な日本語 `defaultProps`、`label`（「問い合わせ先」「組織案内」「画像」「余白」）、`BlockDefinition`（Render/Editor を `@/components/blocks/*` から実行時import）、props型を export。
  - image の `defaultProps.src` は空文字（`''`）でよい（Renderがプレースホルダ表示）。spacer の `defaultProps.size` は `'md'`。
  - 既存 hero/notice 等と同じ構造・命名規則。
- `src/lib/blocks/definitions/index.ts` に4ブロックを `allBlocks` 追加＋ `*Block`/`*Props` を re-export。
- `src/components/`・`types.ts`・`registry.ts`・`src/server/`・`src/app/` は触らない。

## ② UI担当（`src/components/blocks/`）
- 新規: `ContactBlock.tsx` / `OrgGuideBlock.tsx` / `ImageBlock.tsx` / `SpacerBlock.tsx`
  - 各 `*Render`/`*Editor` を named export（`ContactRender`/`ContactEditor` 等）。props型は `import type { ContactProps, OrgGuideProps, ImageProps, SpacerProps } from '@/lib/blocks/definitions'`。
  - 各Renderルートに `data-block="<type>"`。既存 `HeroBlock`/`NoticeBlock` の規約踏襲（トークン・focus-ring・44px・絵文字禁止・インラインSVG）。**デザインは `ui-ux-pro-max` 起点**、WCAG配慮。
  - ポイント:
    - contact: 連絡先カード。tel は `tel:` リンク、email は `mailto:` リンク。任意項目は存在チェックして表示。住所/受付時間はアイコン併記。
    - org-guide: 部署一覧（カードまたはリスト）。`href` があればリンク（`next/link`）。
    - image: `next/image` を `unoptimized` で使用。`src` が空なら「画像未設定」プレースホルダ。`alt` を必ず適用。`caption` は `<figure>/<figcaption>`。レスポンシブ（max-width:100%）。`width`/`height` は固定値が必要なら適切に（unoptimizedでも width/height か fill が必要なため、レイアウト崩れないよう実装。例: 親に aspect 指定＋`fill`、または既知の大きめ width/height＋`style={{height:'auto'}}`）。Next 16 の `next/image` 仕様を `node_modules/next/dist/docs/` で確認。
    - spacer: size に応じた縦余白のみ（装飾なし）。編集UIは size 選択（ラジオ/セレクト）。Render は `aria-hidden` な空要素でよい。
  - `src/lib/`・`src/server/`・`src/app/` は触らない。

## 共通
- Next.js 16: 実装前に `node_modules/next/dist/docs/` を確認（特に image の `next/image`）。
- git は実行しない（①が統合・型/lint/build・スクショ確認）。
- 既存ブロックと同じ規約を踏襲。
