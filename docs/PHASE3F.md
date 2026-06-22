# フェーズ3F — 権限ロール（管理者 / 利用者）とユーザー管理（分担契約）

ロールを **2種**に確定し、管理者専用の「ユーザー管理」を追加する。

- **管理者 (`admin`)**: ページ編集 ＋ **ユーザー管理（アカウント追加/削除/ロール変更）**
- **利用者 (`user`)**: ページ編集のみ（ユーザー管理は不可）

①完了済み（触らない）:
- `src/server/auth.ts`: `requireAdmin()` / `isAdmin(user)` / `type Role = 'admin'|'user'` 追加。`requireUser`/`getCurrentUser` 既存。
- Prisma `User.role` 既定を `'user'` に変更＋移行。初期管理者(seed)は `role='admin'`。
- ページ編集系アクション（save/publish/create/delete/updateMeta）は既に `requireUser`（＝両ロール可）。

## 契約: ユーザー管理アクション（③が実装・②が型/関数を参照）
```ts
// src/server/userActions.ts
export interface UserSummary { id: string; email: string; name: string; role: 'admin' | 'user'; createdAt: string }
export async function listUsers(): Promise<UserSummary[]>;                          // requireAdmin
export async function createUser(input: { email: string; name: string; password: string; role: 'admin' | 'user' }): Promise<{ ok: boolean; error?: string }>; // requireAdmin
export async function deleteUser(id: string): Promise<{ ok: boolean; error?: string }>;        // requireAdmin
export async function updateUserRole(id: string, role: 'admin' | 'user'): Promise<{ ok: boolean; error?: string }>; // requireAdmin
```

## ③ システム系（`src/server/`・`src/app/admin/`）
- `src/server/userActions.ts`（新規, `'use server'`）: 上記4関数。`import { requireAdmin, hashPassword } from '@/server/auth'`、`import { prisma } from '@/server/db'`。
  - 各関数冒頭で `try { await requireAdmin() } catch { return ... }`（listUsers は例外時 `[]`）。
  - createUser: email形式・name必須・password 8文字以上を検証、email重複は `{ok:false,error:'このメールアドレスは既に登録されています。'}`、`hashPassword` してcreate。`createdAt` は ISO 文字列で返す。
  - deleteUser: **自分自身は削除不可**（`requireAdmin` の id と比較）`{ok:false,error:'自分自身は削除できません。'}`、**最後の管理者は削除不可**（admin数が1なら不可）。
  - updateUserRole: **最後の管理者を user に降格不可**。自分自身の降格も最後の管理者なら不可。
  - 変更系は `revalidatePath('/admin/users')`。
- `src/app/admin/users/page.tsx`（新規, Server Component）: `getCurrentUser()`、`role!=='admin'` なら `redirect('/admin/pages')`（利用者は閲覧不可）。`listUsers()` を取得し `@/components/admin/UserManager` に `users` / `currentUserId`(=現在のユーザーid) / `createAction={createUser}` / `deleteAction={deleteUser}` / `updateRoleAction={updateUserRole}` を渡す。
- `src/app/admin/layout.tsx`（編集）: 既存のユーザー表示＋ログアウトは維持。ナビ `@/components/admin/AdminNav` を追加し `isAdmin={getCurrentUser のrole==='admin'}` を渡す（`isAdmin` ヘルパ利用可）。
- `src/components/`・`auth.ts`・`middleware.ts`・`src/lib/`・Prisma は触らない。Next 16 の Server Actions / redirect / revalidatePath を docs で確認。

## ② UI担当（`src/components/admin/`）
- `src/components/admin/AdminNav.tsx`（`'use client'`, 新規）: `export interface AdminNavProps { isAdmin: boolean }`。「ページ管理」→`/admin/pages`、`isAdmin` の時のみ「ユーザー管理」→`/admin/users`。`usePathname`(`next/navigation`)で現在地をハイライト（`aria-current="page"`）。`next/link`、focus-ring、44px。
- `src/components/admin/UserManager.tsx`（`'use client'`, 新規）:
  - `import type { UserSummary } from '@/server/userActions'`。`export interface UserManagerProps { users: UserSummary[]; currentUserId: string; createAction: (input:{email:string;name:string;password:string;role:'admin'|'user'})=>Promise<{ok:boolean;error?:string}>; deleteAction:(id:string)=>Promise<{ok:boolean;error?:string}>; updateRoleAction:(id:string,role:'admin'|'user')=>Promise<{ok:boolean;error?:string}> }`
  - ユーザー一覧（メール/名前/ロールバッジ＝色＋テキストで区別/作成日）、新規作成フォーム（email/name/password/ロール選択）、各行に削除（**自分自身の行は削除不可＝disable＋理由**）とロール変更（select か トグル）。各操作は実行中ローディング・結果を `aria-live`。
  - `ui-ux-pro-max` 起点・トークンのみ・絵文字禁止（インラインSVG）・WCAG配慮・破壊的操作（削除）は確認ステップ＋destructive色で分離（既存 `DeletePageButton` の作法を踏襲可）。
- `src/lib/`・`src/server/`・`src/app/` は触らない。

## 共通
- git は実行しない（①が統合・型/lint/build・スクショ確認）。
- 利用者は `/admin/pages`・ビルダーは使える（ページ編集可）。`/admin/users` は管理者のみ（ルートで弾く＋アクションで `requireAdmin`）。
