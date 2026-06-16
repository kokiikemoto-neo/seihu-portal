# 開発進捗 — Seihu Portal

最終更新: 2026-06-16

政府機関ポータル＋ページビルダー。3エージェント体制（①全体管理 / ②UI / ③システム）で開発中。
体制・設計の詳細は [CLAUDE.md](CLAUDE.md) / [docs/TEAM.md](docs/TEAM.md) / [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## サマリ

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1 | 基盤（ブロック型・レジストリ・レンダラ・永続化抽象・デザイントークン） | ✅ 完了 |
| 2 | ページビルダーMVP（編集・保存・公開・公開ページ表示） | ✅ 完了 |
| 3 | 本番化（永続化Prisma・認証/権限・固有ブロック・デプロイ） | ⬜ 未着手 |

品質ゲート（最終確認時）: `tsc --noEmit` ✅ / `eslint` ✅ / `next build` ✅ / dev実機スモーク ✅

## できていること

- [x] ブロック追加・並び替え（@dnd-kit、キーボード操作対応＋上下ボタン）・削除
- [x] プロパティ編集パネル（ブロックごとのEditor）
- [x] 下書き保存・公開（draft → published）
- [x] 公開ページ表示 `/(public)/[...slug]`（未公開は404）
- [x] ブロック3種: hero / notice（緊急度: normal/important/emergency）/ richtext
- [x] デザインシステム（MASTER.md準拠、WCAG配慮）＋スタイルガイド `/style-guide`
- [x] 管理画面: ページ一覧 `/admin/pages` / ビルダー `/admin/builder/[id]`
- [x] デモページ（slug: `home`, id: `demo-home`）

## まだできていないこと

- [ ] データ永続化（現状インメモリ。サーバ再起動で初期化）→ Prisma + SQLite/Postgres
- [ ] 認証・権限（編集者/閲覧者）
- [ ] ページ新規作成・削除UI
- [ ] 政府サイト固有ブロック（手続き検索・緊急情報バナー・組織案内・パンくず等）
- [ ] SEO/メタ最適化、本番デプロイ、監査ログ

## ローカルで確認する

```bash
npm run dev    # http://localhost:3000
```
1. `/admin/builder/demo-home` … ブロックを編集 → 「公開」
2. `/home` … 公開結果を表示
3. `/style-guide` … デザイン確認

※ 保存先がメモリのため dev 再起動で状態は初期化される（フェーズ3で永続化）。

## 進捗の見かた（コマンド）

```bash
git log --oneline           # コミット履歴（[MGR]/[UI]/[SYS] で担当が分かる）
git log --oneline | wc -l   # コミット数
npm run build               # 全ページがビルドできるか
```
