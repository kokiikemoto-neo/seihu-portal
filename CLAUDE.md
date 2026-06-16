@AGENTS.md

# Seihu Portal — プロジェクト憲法（全エージェント共通）

政府機関向けのポータルサイト。**サイト上で「どこに何を配置するか」を設計できる本格的なページビルダー**を備える。本番運用を見据えた設計・アクセシビリティ・拡張性を重視する。

- スタック: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**
- 言語: UI・ドキュメントとも日本語が基本
- 詳細設計: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 体制と役割分担: [docs/TEAM.md](docs/TEAM.md)

## ⚠️ 最重要ルール

1. **Next.js 16 は学習データと異なる。** コードを書く前に必ず `node_modules/next/dist/docs/` の該当ガイドを読む（[AGENTS.md](AGENTS.md)）。推測でAPIを使わない。
2. **デザインは ui-ux-pro-max skill に従う。** Source of Truth は [design-system/seihu-portal/MASTER.md](design-system/seihu-portal/MASTER.md)。ページ固有の逸脱は `design-system/seihu-portal/pages/<page>.md` に記録し、それが MASTER を上書きする。
3. **政府サイトのためアクセシビリティは WCAG AAA を目標。** コントラスト4.5:1以上、キーボード操作、フォーカスリング、`prefers-reduced-motion`、44×44pxタッチターゲットを必須とする。
4. **絵文字をアイコンに使わない。** SVG（Heroicons / Lucide）を使う。

## 3エージェント体制（要約）

| 役割 | 担当領域 | 主な作業ディレクトリ |
|------|----------|----------------------|
| **① 全体管理** | アーキテクチャ・規約・統合・レビュー・タスク割当・型/契約の管理 | `docs/`, ルート設定, 共有型 |
| **② UI担当**（`ui-ux-pro-max`使用） | デザインシステム実装・公開ページ/ブロックの見た目・ビルダーUI・a11y・レスポンシブ | `src/components/`, `src/app/(public)/`, `src/styles/` |
| **③ システム系** | データモデル・ブロックレジストリ・永続化・API/Server Actions・保存/公開ロジック・レンダリングエンジン・バリデーション | `src/lib/`, `src/server/`, `prisma/`, `src/app/api/` |

詳細・境界・受け渡し契約は [docs/TEAM.md](docs/TEAM.md) を参照。

## 開発の約束

- **型と契約の共有**: ブロックのスキーマ・ページのデータ型など、UIとシステムの境界になる型は `src/lib/blocks/types.ts` 等に集約し、①が整合を管理する。勝手に重複定義しない。
- **コミット**: 意味のある単位でコミット。タスクスケジューラが3時間ごと+毎日19:00に自動コミット&pushするが、各エージェントは作業完了時に明示的にコミットすること（自動pushはバックアップ目的）。
- **コミットメッセージ**: `[UI] ...` `[SYS] ...` `[MGR] ...` の接頭辞で担当を示す。
- **品質ゲート**: コミット前に `npm run lint` と `npx tsc --noEmit` が通ること。
- **検証**: UIの変更は実際に `npm run dev` で表示確認。`webapp-testing` skill を活用可。

## よく使うコマンド

```bash
npm run dev      # 開発サーバ
npm run build    # 本番ビルド
npm run lint     # ESLint
npx tsc --noEmit # 型チェック

# UI UX Pro Max（デザイン判断時）
python ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system
python ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <product|style|color|typography|ux|chart|landing>
```
