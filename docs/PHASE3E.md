# フェーズ3E — 認証（管理画面の保護, 分担契約）

`/admin` 以下を編集者ログインで保護する。

①完了済み（セキュリティコア・触らない）:
- `src/server/auth.ts`: `hashPassword`/`verifyPassword`/`setSessionCookie`/`clearSessionCookie`/`getCurrentUser`/`requireUser`/`SessionUser`/`SESSION_COOKIE`
- `src/middleware.ts`: `/admin/:path*` のJWT検証→未ログインは `/login?from=...` へ
- Prisma `User`（email/name/passwordHash/role）＋移行、`prisma/seed.mjs` で初期管理者作成
- env: `SESSION_SECRET`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`（.env / .env.example 追加済）
- bcryptjs / jose 導入済

## ③ システム系（`src/server/actions.ts`・`src/app/`）
- `src/server/actions.ts`:
  - `import { prisma } from '@/server/db'` と `import { verifyPassword, setSessionCookie, clearSessionCookie, requireUser, type SessionUser } from '@/server/auth'`。
  - `login(input: { email: string; password: string }): Promise<{ ok: boolean; error?: string }>`:
    - email で `prisma.user.findUnique`。無ければ／パスワード不一致なら **同一の汎用エラー**（`{ ok:false, error:'メールアドレスまたはパスワードが正しくありません。' }`）でユーザー列挙を防ぐ。
    - 一致なら `setSessionCookie({ id, email, name, role })` して `{ ok:true }`。例外は `{ ok:false, error:'ログイン処理でエラーが発生しました。' }`。
  - `logout(): Promise<void>`: `clearSessionCookie()` → `redirect('/login')`（`next/navigation` の redirect）。
  - **既存の admin アクションを保護**: `savePageLayout`/`publishPage`/`createPage`/`deletePage`/`updatePageMeta` の冒頭で `try { await requireUser() } catch { return { ok:false } }`（戻り値型に合わせ、createPage は `{ok:false,error:'ログインが必要です。'}`）。多層防御。
- `src/app/login/page.tsx`（新規, Server Component）:
  - `getCurrentUser()` 済みなら `redirect('/admin/pages')`。
  - `searchParams`（Promise）から `from` を取得し**サニタイズ**（`/` 始まり かつ `//` でない場合のみ採用、既定 `/admin/pages`）。これを `redirectTo` として `@/components/auth/LoginForm` に渡し、`loginAction={login}` も渡す。`<main id="main-content">` でラップ。**この画面は未ログインでアクセスされる**（middlewareの対象外: matcherは/admin配下のみ）。
- `src/app/admin/layout.tsx`（新規, Server Component）:
  - `getCurrentUser()` でユーザー取得（middlewareで保護済だが表示用）。上部にユーザー名/メール表示＋`@/components/auth/LogoutButton`（`logoutAction={logout}`）を置き、`{children}` を描画。
- `src/components/`・`src/server/auth.ts`・`src/middleware.ts`・`src/lib/`・Prisma は触らない。Next 16 の Server Actions / `redirect` / `cookies` / `searchParams`(Promise) を `node_modules/next/dist/docs/` で確認。

## ② UI担当（`src/components/auth/`）
- `src/components/auth/LoginForm.tsx`（`'use client'`, 新規）:
  - `export interface LoginFormProps { loginAction: (input:{email:string;password:string}) => Promise<{ok:boolean;error?:string}>; redirectTo: string }`
  - email（`type=email`,autocomplete username）/password（`type=password`,autocomplete current-password）入力、送信中ローディング+disabled、`error` を `aria-live`/`role=alert` 表示。**成功時（ok）は `useRouter().replace(redirectTo)`** で遷移（`next/navigation`）。label必須・focus-ring・44px・MASTER.md準拠の落ち着いた政府ログイン画面。中央寄せカード。
- `src/components/auth/LogoutButton.tsx`（`'use client'`, 新規）:
  - `export interface LogoutButtonProps { logoutAction: () => Promise<void> }`
  - クリックで `logoutAction()` を呼ぶボタン（`<form action={logoutAction}>` でも可）。実行中の簡易フィードバック。destructiveでない通常ボタン。アイコン＋「ログアウト」。
- `ui-ux-pro-max` 起点・トークンのみ・絵文字禁止（インラインSVG）・WCAG配慮。`src/lib/`・`src/server/`・`src/app/` は触らない。

## 共通
- git は実行しない（①が統合・型/lint/build・スクショ確認）。
- ログイン画面 `/login` は公開（middleware対象外）。初期管理者は `.env` の ADMIN_EMAIL/ADMIN_PASSWORD（seed済）。
