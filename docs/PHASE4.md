# フェーズ4 — 案件・書類進捗管理（社内向け主機能, 分担契約）

社内ポータルの主機能。**案件（Project）ごとに必要書類（Document）と各書類のステータスを管理**し、ポータル上で閲覧・編集する。
- **閲覧**: ログインユーザー全員（管理者・利用者とも）
- **編集**（案件/書類の追加・変更・削除・ステータス変更）: **管理者のみ**

①完了済み（触らない）:
- Prisma `Project`（name/description?/owner?/dueDate?）, `Document`（projectId/name/docType?/status/assignee?/dueDate?/note?/order）＋移行・サンプルseed（proj-sample-1/2）。
- `src/lib/tracking/types.ts`: `DocumentStatus`('not_started'|'in_progress'|'reviewing'|'done')・`DOCUMENT_STATUSES`・`DOCUMENT_STATUS_LABELS`・`DocumentItem`・`ProjectSummary`・`ProjectDetail`。
- 認証: `requireUser`（閲覧）/`requireAdmin`（編集）/`getCurrentUser`/`isAdmin`（`@/server/auth`）。

## 契約: アクション（③が実装、②が型/関数を参照）
```ts
// src/server/projectActions.ts
import type { ProjectSummary, ProjectDetail, DocumentStatus } from '@/lib/tracking/types';
export async function listProjects(): Promise<ProjectSummary[]>;                    // requireUser（例外時[]）
export async function getProject(id: string): Promise<ProjectDetail | null>;        // requireUser
export async function createProject(input: { name: string; description?: string; owner?: string; dueDate?: string }): Promise<{ ok: boolean; id?: string; error?: string }>; // requireAdmin
export async function updateProject(id: string, input: { name?: string; description?: string; owner?: string; dueDate?: string }): Promise<{ ok: boolean; error?: string }>;     // requireAdmin
export async function deleteProject(id: string): Promise<{ ok: boolean; error?: string }>;        // requireAdmin
export async function addDocument(projectId: string, input: { name: string; docType?: string; assignee?: string; dueDate?: string; note?: string }): Promise<{ ok: boolean; error?: string }>;   // requireAdmin
export async function updateDocument(id: string, input: { name?: string; docType?: string; status?: DocumentStatus; assignee?: string; dueDate?: string; note?: string }): Promise<{ ok: boolean; error?: string }>;  // requireAdmin（ステータス変更もこれ）
export async function deleteDocument(id: string): Promise<{ ok: boolean; error?: string }>;       // requireAdmin
```
- 日付は `'YYYY-MM-DD'` 文字列で受け取り、空文字は `null`、それ以外は `new Date()`。返却の `dueDate`/`createdAt`/`updatedAt` は ISO 文字列。
- `ProjectSummary.doneCount` は `status==='done'` の数、`documentCount` は総数。
- 変更系は `revalidatePath('/admin/projects')` および該当詳細を revalidate。

## ③ システム系（`src/server/`・`src/app/`）
- `src/server/projectActions.ts`（新規, `'use server'`）: 上記8関数。`import { prisma } from '@/server/db'`、`import { requireUser, requireAdmin } from '@/server/auth'`。read系は `requireUser`、write系は `requireAdmin`（失敗時 `{ok:false,error:'権限がありません。'}` 等）。createProject は name 必須検証。
- `src/app/admin/projects/page.tsx`（新規, Server Component）: `getCurrentUser` で `canEdit = role==='admin'`。`listProjects()` → `@/components/tracking/ProjectList` に `projects` / `canEdit` / `createAction={createProject}` / `deleteAction={deleteProject}` を渡す。
- `src/app/admin/projects/[id]/page.tsx`（新規, Server Component）: `getProject(id)`（無ければ `notFound()`）。`canEdit` 判定。`@/components/tracking/ProjectDetail` に `project` / `canEdit` / `updateProjectAction` / `deleteProjectAction` / `addDocumentAction` / `updateDocumentAction` / `deleteDocumentAction` を渡す（`params` は Promise）。
- `src/app/login/page.tsx`（編集）: ログイン後の既定リダイレクト先を `/admin/pages` → **`/admin/projects`** に変更（`from` サニタイズの既定値）。それ以外は変更しない。
- `src/components/`・`src/lib/`・`auth.ts`・`middleware.ts`・Prisma・他の `src/server/*` は触らない。Next 16 docs（Server Actions/`params`/`notFound`/`revalidatePath`）を確認。

## ② UI担当（`src/components/tracking/`・`AdminNav`）
- `src/components/tracking/StatusBadge.tsx`（新規）: `DocumentStatus` を **色＋ラベル**バッジに（未着手=muted系 / 作成中=accent系 / 確認中=warning系 / 完了=success系。色だけに依存せずラベル必須）。`DOCUMENT_STATUS_LABELS` を使用。
- `src/components/tracking/ProjectList.tsx`（`'use client'`, 新規）: `export interface ProjectListProps { projects: ProjectSummary[]; canEdit: boolean; createAction:(input:{name:string;description?:string;owner?:string;dueDate?:string})=>Promise<{ok:boolean;id?:string;error?:string}>; deleteAction:(id:string)=>Promise<{ok:boolean;error?:string}> }`。
  - 案件カード/行一覧（名称・担当・期限・**進捗 doneCount/documentCount を進捗バーやバッジで**）、各案件は詳細 `/admin/projects/<id>` へ `next/link`。
  - `canEdit` の時のみ「新規案件」作成フォーム（name必須/description/owner/dueDate(date)）と各案件の削除（確認ステップ・destructive）。`canEdit=false` では編集系UIを出さない。
- `src/components/tracking/ProjectDetail.tsx`（`'use client'`, 新規）: `export interface ProjectDetailProps { project: ProjectDetail; canEdit: boolean; updateProjectAction:(id:string,input:{name?:string;description?:string;owner?:string;dueDate?:string})=>Promise<{ok:boolean;error?:string}>; deleteProjectAction:(id:string)=>Promise<{ok:boolean;error?:string}>; addDocumentAction:(projectId:string,input:{name:string;docType?:string;assignee?:string;dueDate?:string;note?:string})=>Promise<{ok:boolean;error?:string}>; updateDocumentAction:(id:string,input:{name?:string;docType?:string;status?:DocumentStatus;assignee?:string;dueDate?:string;note?:string})=>Promise<{ok:boolean;error?:string}>; deleteDocumentAction:(id:string)=>Promise<{ok:boolean;error?:string}> }`。
  - 案件概要（名称・説明・担当・期限・進捗サマリ）。書類一覧（テーブル: 書類名/種類/担当/期限/ステータス）。各書類に `StatusBadge`。
  - `canEdit` の時: 各書類のステータスを **select で即変更**（`updateDocumentAction(id,{status})`）、書類の追加/編集/削除、案件情報の編集・削除。`canEdit=false` では読み取り専用（バッジ表示のみ）。
  - 型は `import type { ProjectDetail, DocumentItem, DocumentStatus } from '@/lib/tracking/types'`。
- `src/components/admin/AdminNav.tsx`（編集）: ナビ先頭に **「案件・進捗」→`/admin/projects`**（全ロール表示）を追加。既存の「ページ管理」「（管理者のみ）ユーザー管理」は維持。`usePathname` のハイライトも対応。
- `src/lib/`・`src/server/`・`src/app/` は触らない。`ui-ux-pro-max` 起点・トークンのみ・絵文字禁止・WCAG配慮。

## 共通
- git は実行しない（①が統合・型/lint/build・スクショ確認）。
- 閲覧は全ログインユーザー、編集系アクションは `requireAdmin`（UIの `canEdit` と二重で担保）。
