'use client';
/**
 * ユーザー管理（② UI担当, Client Component）— 管理者専用画面の本体。
 *
 * 機能:
 *   1. ユーザー一覧: メール / 名前 / ロールバッジ（色＋テキストで区別）/ 作成日。
 *   2. 新規作成フォーム: email / name / password（8文字以上の注記）/ ロール選択（select）。
 *   3. 各行の操作:
 *      - ロール変更（select）: 変更すると updateRoleAction を即時実行（実行中ローディング）。
 *      - 削除: 確認ステップ＋destructive色（DeletePageButton の作法を踏襲）。
 *        ★ 自分自身（currentUserId）の行は削除ボタンを disable し、理由を表示する。
 *   各操作の進行状況・結果は aria-live / role="alert" で読み上げ。
 *
 * 契約:
 *   import type { UserSummary } from '@/server/userActions'（③が定義・re-export）。
 *   export interface UserManagerProps {
 *     users; currentUserId; createAction; deleteAction; updateRoleAction
 *   }
 *   各 action は純粋な async 関数（FormData ではない）で {ok, error?} を返す。
 *
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠（WCAG AAA 目標）。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/ label 必須 / focus-ring /
 *           44px タッチターゲット。テーブルは overflow-x-auto でモバイル横スクロール対応。
 *           ロールは色だけでなくテキストでも区別（色覚配慮）。
 */
import { useId, useState, useTransition } from 'react';
import type React from 'react';
import type { UserSummary } from '@/server/userActions';

type Role = 'admin' | 'user';

export interface UserManagerProps {
  users: UserSummary[];
  currentUserId: string;
  createAction: (input: {
    email: string;
    name: string;
    password: string;
    role: Role;
  }) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  updateRoleAction: (id: string, role: Role) => Promise<{ ok: boolean; error?: string }>;
}

/* ----------------------------------------------------------------------------
 * アイコン（インラインSVG。絵文字禁止）
 * -------------------------------------------------------------------------- */
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={`${className ?? 'h-5 w-5'} animate-spin`}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-4 w-4'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.285z"
    />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-4 w-4'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

/* ----------------------------------------------------------------------------
 * 共有スタイル / ヘルパ
 * -------------------------------------------------------------------------- */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

const ROLE_LABEL: Record<Role, string> = {
  admin: '管理者',
  user: '利用者',
};

function formatDate(iso: string): string {
  // createdAt は ISO 文字列。日本語ロケールで「YYYY/MM/DD」を表示。
  // 不正値でも落ちないようガード。
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** ロールバッジ: 色だけでなくアイコン＋テキストでも役割を区別（色覚配慮 / WCAG）。 */
const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs font-semibold ${
        isAdmin
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {isAdmin ? (
        <ShieldIcon className="h-3.5 w-3.5" />
      ) : (
        <UserIcon className="h-3.5 w-3.5" />
      )}
      {ROLE_LABEL[role]}
    </span>
  );
};

/* ----------------------------------------------------------------------------
 * 新規作成フォーム
 * -------------------------------------------------------------------------- */
const CreateUserForm: React.FC<{
  createAction: UserManagerProps['createAction'];
}> = ({ createAction }) => {
  const baseId = useId();
  const emailId = `${baseId}-email`;
  const nameId = `${baseId}-name`;
  const passwordId = `${baseId}-password`;
  const passwordHintId = `${baseId}-password-hint`;
  const roleId = `${baseId}-role`;
  const statusId = `${baseId}-status`;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    // クライアント側の最低限の検証（最終判定は③の Server Action が行う）。
    if (!trimmedEmail) {
      setError('メールアドレスを入力してください。');
      return;
    }
    if (!trimmedName) {
      setError('名前を入力してください。');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    startTransition(async () => {
      const result = await createAction({
        email: trimmedEmail,
        name: trimmedName,
        password,
        role,
      });
      if (result.ok) {
        setSuccess(`「${trimmedName}」を作成しました。`);
        setEmail('');
        setName('');
        setPassword('');
        setRole('user');
      } else {
        setError(result.error ?? 'ユーザーの作成に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={nameId} className="block font-sans text-sm font-semibold text-foreground">
            名前
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            required
            autoComplete="off"
            placeholder="例: 山田 太郎"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={emailId}
            className="block font-sans text-sm font-semibold text-foreground"
          >
            メールアドレス
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            placeholder="例: user@example.go.jp"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={passwordId}
            className="block font-sans text-sm font-semibold text-foreground"
          >
            パスワード
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            required
            autoComplete="new-password"
            aria-describedby={passwordHintId}
            placeholder="8文字以上"
            className={inputClass}
          />
          <p id={passwordHintId} className="font-sans text-xs text-muted-foreground">
            8文字以上で設定してください。
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={roleId} className="block font-sans text-sm font-semibold text-foreground">
            ロール
          </label>
          <select
            id={roleId}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isPending}
            className={inputClass}
          >
            <option value="user">利用者（ページ編集のみ）</option>
            <option value="admin">管理者（ユーザー管理も可）</option>
          </select>
        </div>
      </div>

      {/* 状態通知（エラー / 成功）を aria-live で読み上げ。 */}
      <div id={statusId} aria-live="polite" aria-atomic="true">
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 font-sans text-sm font-medium text-destructive"
          >
            <ExclamationIcon className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}
        {success ? (
          <p className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-3 font-sans text-sm font-medium text-success">
            <CheckCircleIcon className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground shadow-md transition-colors duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent"
        >
          {isPending ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              作成中…
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              ユーザーを作成
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ----------------------------------------------------------------------------
 * 行のロール変更（select）
 * -------------------------------------------------------------------------- */
const RoleSelector: React.FC<{
  user: UserSummary;
  updateRoleAction: UserManagerProps['updateRoleAction'];
}> = ({ user, updateRoleAction }) => {
  const baseId = useId();
  const selectId = `${baseId}-role`;
  const statusId = `${baseId}-status`;

  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Role;
    if (next === role || isPending) return;
    const previous = role;
    setError(null);
    setRole(next); // 楽観的更新（失敗時は元へ戻す）
    startTransition(async () => {
      const result = await updateRoleAction(user.id, next);
      if (!result.ok) {
        setRole(previous);
        setError(result.error ?? 'ロールの変更に失敗しました。');
      }
      // 成功時はサーバ側 revalidate で一覧が再描画される。
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <label htmlFor={selectId} className="sr-only">
        {`${user.name} のロール`}
      </label>
      <div className="inline-flex items-center gap-2">
        <select
          id={selectId}
          value={role}
          onChange={handleChange}
          disabled={isPending}
          aria-describedby={error ? statusId : undefined}
          className="focus-ring min-h-[44px] cursor-pointer rounded-md border border-input bg-surface px-3 py-2 font-sans text-sm text-surface-foreground transition-shadow duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="user">利用者</option>
          <option value="admin">管理者</option>
        </select>
        {isPending ? (
          <SpinnerIcon className="h-4 w-4 text-muted-foreground" />
        ) : null}
      </div>
      <span id={statusId} aria-live="polite" aria-atomic="true">
        {error ? (
          <span role="alert" className="font-sans text-xs font-medium text-destructive">
            {error}
          </span>
        ) : null}
      </span>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 行の削除（確認ステップ＋destructive色。DeletePageButton の作法を踏襲）
 * 自分自身（isSelf）の行はボタンを disable し、理由を表示する。
 * -------------------------------------------------------------------------- */
const DeleteUserButton: React.FC<{
  user: UserSummary;
  isSelf: boolean;
  deleteAction: UserManagerProps['deleteAction'];
}> = ({ user, isSelf, deleteAction }) => {
  const baseId = useId();
  const confirmId = `${baseId}-confirm`;
  const statusId = `${baseId}-status`;

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAction(user.id);
      if (!result.ok) {
        setError(result.error ?? '削除に失敗しました。時間をおいて再度お試しください。');
        setConfirming(false);
      }
      // 成功時はサーバ側 revalidate で一覧が再描画され、この行は消える。
    });
  }

  // 自分自身は削除不可: ボタンを disable し理由を明示。
  if (isSelf) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          disabled
          aria-describedby={statusId}
          className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-muted-foreground opacity-60"
        >
          <TrashIcon className="h-4 w-4" />
          削除
        </button>
        <span id={statusId} className="font-sans text-xs text-muted-foreground">
          自分自身は削除できません。
        </span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-labelledby={confirmId}
        className="inline-flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 sm:flex-row sm:items-center"
      >
        <p id={confirmId} className="font-sans text-sm font-medium text-foreground">
          本当に「{user.name}」を削除しますか？
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-md bg-destructive px-4 py-2.5 font-sans text-sm font-semibold text-destructive-foreground shadow-sm transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                削除中…
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                削除する
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-md border border-input bg-surface px-4 py-2.5 font-sans text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        aria-label={`「${user.name}」を削除`}
        className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10"
      >
        <TrashIcon className="h-4 w-4" />
        削除
      </button>
      <span id={statusId} aria-live="polite" aria-atomic="true">
        {error ? (
          <span role="alert" className="font-sans text-xs font-medium text-destructive">
            {error}
          </span>
        ) : null}
      </span>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 本体
 * -------------------------------------------------------------------------- */
export const UserManager: React.FC<UserManagerProps> = ({
  users,
  currentUserId,
  createAction,
  deleteAction,
  updateRoleAction,
}) => {
  return (
    <div className="space-y-10">
      {/* 新規作成 */}
      <section aria-labelledby="user-create-heading">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2
            id="user-create-heading"
            className="font-heading text-xl font-semibold text-foreground"
          >
            ユーザーを追加
          </h2>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            新しいアカウントを作成します。ロールで権限（管理者 / 利用者）を指定してください。
          </p>
          <div className="mt-6">
            <CreateUserForm createAction={createAction} />
          </div>
        </div>
      </section>

      {/* 一覧 */}
      <section aria-labelledby="user-list-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="user-list-heading" className="font-heading text-xl font-semibold text-foreground">
            登録ユーザー
          </h2>
          <p className="font-sans text-sm text-muted-foreground">{users.length} 件</p>
        </div>

        {users.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-6 font-sans text-sm text-muted-foreground">
            登録されているユーザーはありません。
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <caption className="sr-only">登録済みユーザーの一覧と操作</caption>
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    名前 / メールアドレス
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    ロール
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    作成日
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-b-0 align-top"
                    >
                      <th scope="row" className="px-4 py-4 font-normal">
                        <span className="flex flex-col">
                          <span className="font-sans text-sm font-semibold text-foreground">
                            {user.name}
                            {isSelf ? (
                              <span className="ml-2 rounded-full border border-border bg-muted px-2 py-0.5 font-sans text-xs font-medium text-muted-foreground">
                                自分
                              </span>
                            ) : null}
                          </span>
                          <span className="font-sans text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                      </th>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-3">
                          <RoleSelector user={user} updateRoleAction={updateRoleAction} />
                          <DeleteUserButton
                            user={user}
                            isSelf={isSelf}
                            deleteAction={deleteAction}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserManager;
