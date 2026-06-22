# 本番デプロイ手順 — Vercel + マネージドPostgres

社内ポータルを Vercel にデプロイし、データはマネージドPostgres（Neon / Supabase / Vercel Postgres 等）に保存する構成。

> ⚠️ 社内データを外部クラウドに置くことになります。アクセス制限（後述）と、保存先クラウドの所在・規約を必ず確認してください。

## 構成の前提

- **ローカル開発**: SQLite（`prisma/schema.prisma`）。`start-portal.bat` で従来どおり動作。本番設定の影響は受けない。
- **本番**: PostgreSQL（`prisma/postgres/schema.prisma`）。Vercel のビルドでこちらを使う。
- **2スキーマは同じモデル**。モデルを変えたら**両方**を更新すること（`prisma/schema.prisma` と `prisma/postgres/schema.prisma`）。

## 1. マネージドPostgresを用意

Neon を例にする（Supabase / Vercel Postgres でも可）。

1. Postgresデータベースを作成。
2. 2種類の接続URLを控える:
   - **プール接続URL**（アプリ実行時用）… Neon なら `...-pooler...` を含むホスト → `DATABASE_URL`
   - **直結URL**（マイグレーション用）… プールを通さないホスト → `DIRECT_URL`
   - いずれも `sslmode=require` を付ける。

> サーバーレス（Vercel）は関数ごとに接続するため、実行時は**必ずプール接続**を使う（接続枯渇の回避）。マイグレーションだけ直結を使う。

## 2. Vercel プロジェクト設定

1. このリポジトリを Vercel にインポート（Framework: Next.js 自動検出）。
2. **Build Command** を上書き（Project Settings > Build & Development Settings）:
   ```
   npm run vercel-build
   ```
   （= `prisma generate --schema prisma/postgres/schema.prisma && prisma migrate deploy --schema prisma/postgres/schema.prisma && next build`）
3. **Environment Variables**（`.env.production.example` 参照）を登録:
   | 変数 | 用途 |
   |------|------|
   | `DATABASE_URL` | 実行時（プール接続） |
   | `DIRECT_URL` | マイグレーション（直結） |
   | `SESSION_SECRET` | セッション署名鍵（`openssl rand -base64 48`） |
   | `NEXT_PUBLIC_SITE_URL` | 公開URL（例 `https://portal.example.com`） |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 初期管理者（seed用。投入後変更） |

4. デプロイ実行。ビルド中に `migrate deploy` がPostgresにテーブルを作成する。

## 3. 初期管理者を投入（初回のみ）

DBは空なのでログインできない。次のいずれかで初期管理者を作成:

- **ローカルから本番DBへseed**（推奨・簡単）:
  ```bash
  # 本番の DATABASE_URL/DIRECT_URL/ADMIN_* を環境にセットして実行
  npm run db:seed:prod
  ```
  （`prisma/postgres/schema.prisma` でクライアント生成し、サンプル案件＋管理者を投入）
  > 実行後はローカルのSQLite用クライアントに戻すため `npx prisma generate` を実行。

- もしくは Neon/Supabase の SQL コンソールで `User` に1行 INSERT（passwordHash は bcrypt ハッシュ）。

ログイン後、`/admin/users` で正式アカウントを作成し、初期管理者のパスワードを変更すること。

## 4. アクセス制限（社内向けのため重要）

Vercel はデフォルトでインターネット公開。社内限定にするには:
- Vercel の **Deployment Protection / Password Protection**（有料プラン）、または
- **Vercel Authentication（SSO）**、または
- 前段に社内VPN / IP許可リスト / リバースプロキシ認証。

公開ページ（`/`・`/<slug>`）も含め全体を保護したい場合は上記で全体を制限する。`/admin` 配下はアプリのログインで保護済み。

## 5. 運用メモ

- **マイグレーション追加時**: `prisma/schema.prisma`（SQLite, ローカル）と `prisma/postgres/schema.prisma`（本番）を同期 → 本番は次回デプロイの `vercel-build` で `migrate deploy` が走る。本番migrationを別管理する場合は `prisma migrate dev --schema prisma/postgres/schema.prisma`（要Postgres接続）で生成。
- **バックアップ**: マネージドPostgres側のバックアップ機能を有効化。
- **秘密情報**: `SESSION_SECRET`・`ADMIN_PASSWORD` は本番で必ず変更。`.env`（実値）はコミットしない（`.gitignore`済）。

## 6. ローカルで本番モードを確認したい場合

ローカルにPostgresが無い場合は、Neon等の**開発用DB**を作り、`.env` に本番同様の `DATABASE_URL`/`DIRECT_URL` を設定して:
```bash
npx prisma generate --schema prisma/postgres/schema.prisma
npx prisma migrate deploy --schema prisma/postgres/schema.prisma
npm run db:seed:prod
npm run build && npm start
# 確認後、ローカルSQLiteに戻す: npx prisma generate
```
