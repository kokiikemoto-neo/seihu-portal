# 開発進捗 — Seihu Portal

最終更新: 2026-06-16

政府機関ポータル＋ページビルダー。3エージェント体制（①全体管理 / ②UI / ③システム）で開発中。
体制・設計の詳細は [CLAUDE.md](CLAUDE.md) / [docs/TEAM.md](docs/TEAM.md) / [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## サマリ

| フェーズ | 内容 | 状態 |
|---------|------|------|
| 1 | 基盤（ブロック型・レジストリ・レンダラ・永続化抽象・デザイントークン） | ✅ 完了 |
| 2 | ページビルダーMVP（編集・保存・公開・公開ページ表示） | ✅ 完了 |
| 3A | 永続化(Prisma+SQLite) ・トップ入口ページ ・ページ作成/削除 | ✅ 完了 |
| 3B | 認証/権限 ・政府固有ブロック ・SEO/メタ ・デプロイ | ⬜ 未着手 |

品質ゲート（最終確認時）: `tsc --noEmit` ✅ / `eslint` ✅ / `next build` ✅ / dev実機スモーク ✅
永続化検証: 別プロセスからのDB書き込みをdevサーバが読み取り、公開→`/任意slug`描画→下書き戻しで404、を確認済み。

## できていること

- [x] **トップ入口ページ `/`**（ハブ: 件数サマリ・主要導線・公開ページ一覧）
- [x] ブロック追加・並び替え（@dnd-kit、キーボード操作対応＋上下ボタン）・削除
- [x] プロパティ編集パネル（ブロックごとのEditor）
- [x] 下書き保存・公開（draft → published）
- [x] 公開ページ表示 `/[...slug]`（未公開は404）
- [x] **ページの新規作成・削除UI**（`/admin/pages`）
- [x] **データ永続化（Prisma + SQLite）** … 再起動してもデータが残る
- [x] ブロック3種: hero / notice（緊急度: normal/important/emergency）/ richtext
- [x] デザインシステム（MASTER.md準拠、WCAG配慮）＋スタイルガイド `/style-guide`
- [x] 管理画面: ページ一覧 `/admin/pages` / ビルダー `/admin/builder/[id]`
- [x] デモページ（slug: `home`）※ `npm run db:seed` で投入

## まだできていないこと

- [ ] 認証・権限（編集者/閲覧者）
- [ ] 政府サイト固有ブロック（手続き検索・緊急情報バナー・組織案内・パンくず等）
- [ ] SEO/メタ最適化、本番デプロイ、監査ログ
- [ ] 本番DB（現状SQLite。Postgres等へは DATABASE_URL と provider 変更で移行）

## ローカルで確認する

**かんたん起動**: `start-portal.bat` をダブルクリック（依存の自動インストール＋ブラウザ自動起動）

手動の場合:
```bash
npm install            # 初回のみ
cp .env.example .env   # 初回のみ（DATABASE_URL）
npx prisma migrate dev # 初回のみ（DB作成）
npm run db:seed        # 任意: デモページ投入
npm run dev            # http://localhost:3000
```
1. `/` … 入口。ページ一覧・各種導線
2. `/admin/pages` … ページの作成・削除、ビルダーへ
3. ビルダーで編集 → 「公開」→ `/<slug>` で公開結果を表示
4. `/style-guide` … デザイン確認

## 進捗の見かた（コマンド）

```bash
git log --oneline           # コミット履歴（[MGR]/[UI]/[SYS] で担当が分かる）
git log --oneline | wc -l   # コミット数
npm run build               # 全ページがビルドできるか
```
