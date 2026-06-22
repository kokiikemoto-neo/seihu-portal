'use client';
/**
 * 案件一覧（② UI担当, Client Component）
 *
 * 案件カードの一覧を表示する。各カードに:
 *   - 名称（詳細 /admin/projects/<id> への next/link）
 *   - 担当(owner)・期限(dueDate)
 *   - 進捗（doneCount / documentCount を進捗バー＋件数で）
 * `canEdit` の時のみ:
 *   - 「新規案件」作成フォーム（name必須 / description / owner / dueDate(date)）
 *   - 各案件の削除（確認ステップ・destructive）
 * `canEdit=false` では編集系UIを一切出さない（読み取り専用）。
 *
 * 各操作は実行中ローディング（useTransition）、結果を aria-live / role="alert" で読み上げ。
 *
 * 契約:
 *   import type { ProjectSummary } from '@/lib/tracking/types'。
 *   export interface ProjectListProps {
 *     projects; canEdit; createAction; deleteAction
 *   }
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠（WCAG AAA 目標）。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/ label 必須 / focus-ring /
 *           44px タッチターゲット。進捗は色だけでなく数値テキストでも示す（色覚配慮）。
 */
import { useId, useState, useTransition } from 'react';
import Link from 'next/link';
import type React from 'react';
import type { ProjectSummary } from '@/lib/tracking/types';

export interface ProjectListProps {
  projects: ProjectSummary[];
  canEdit: boolean;
  createAction: (input: {
    name: string;
    description?: string;
    owner?: string;
    dueDate?: string;
  }) => Promise<{ ok: boolean; id?: string; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

/* ----------------------------------------------------------------------------
 * アイコン（インラインSVG。絵文字禁止）
 * -------------------------------------------------------------------------- */
type IconProps = { className?: string };

const PlusIcon: React.FC<IconProps> = ({ className }) => (
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

const SpinnerIcon: React.FC<IconProps> = ({ className }) => (
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

const ExclamationIcon: React.FC<IconProps> = ({ className }) => (
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

const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
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

const TrashIcon: React.FC<IconProps> = ({ className }) => (
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

const FolderIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
    />
  </svg>
);

const UserIcon: React.FC<IconProps> = ({ className }) => (
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

const CalendarIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

/* ----------------------------------------------------------------------------
 * 共有スタイル / ヘルパ
 * -------------------------------------------------------------------------- */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** 進捗バー＋件数。色だけでなく「done/total 件」のテキストでも進捗を示す。 */
const ProgressMeter: React.FC<{ done: number; total: number }> = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-xs font-medium text-muted-foreground">進捗</span>
        <span className="font-sans text-sm font-semibold text-foreground">
          {done} / {total} 件
          <span className="ml-1 font-normal text-muted-foreground">（{pct}%）</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`書類の進捗: ${total} 件中 ${done} 件完了`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            complete ? 'bg-success' : 'bg-accent'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 新規案件 作成フォーム（canEdit 時のみ表示）
 * -------------------------------------------------------------------------- */
const CreateProjectForm: React.FC<{
  createAction: ProjectListProps['createAction'];
}> = ({ createAction }) => {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const descId = `${baseId}-desc`;
  const ownerId = `${baseId}-owner`;
  const dueId = `${baseId}-due`;
  const statusId = `${baseId}-status`;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('案件名を入力してください。');
      return;
    }

    startTransition(async () => {
      const result = await createAction({
        name: trimmedName,
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      if (result.ok) {
        setSuccess(`「${trimmedName}」を作成しました。`);
        setName('');
        setDescription('');
        setOwner('');
        setDueDate('');
      } else {
        setError(result.error ?? '案件の作成に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={nameId} className="block font-sans text-sm font-semibold text-foreground">
            案件名
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
            placeholder="例: ◯◯地区 道路整備事業"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={descId} className="block font-sans text-sm font-semibold text-foreground">
            説明
          </label>
          <textarea
            id={descId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="案件の概要を入力（任意）"
            className={`${inputClass} min-h-[88px] resize-y leading-relaxed`}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ownerId} className="block font-sans text-sm font-semibold text-foreground">
            担当
          </label>
          <input
            id={ownerId}
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={isPending}
            autoComplete="off"
            placeholder="例: 山田 太郎"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={dueId} className="block font-sans text-sm font-semibold text-foreground">
            期限
          </label>
          <input
            id={dueId}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

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
              案件を作成
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ----------------------------------------------------------------------------
 * 案件カードの削除（確認ステップ＋destructive色）
 * -------------------------------------------------------------------------- */
const DeleteProjectButton: React.FC<{
  project: ProjectSummary;
  deleteAction: ProjectListProps['deleteAction'];
}> = ({ project, deleteAction }) => {
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
      const result = await deleteAction(project.id);
      if (!result.ok) {
        setError(result.error ?? '削除に失敗しました。時間をおいて再度お試しください。');
        setConfirming(false);
      }
      // 成功時はサーバ側 revalidate で一覧が再描画され、このカードは消える。
    });
  }

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-labelledby={confirmId}
        className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
      >
        <p id={confirmId} className="font-sans text-sm font-medium text-foreground">
          本当に「{project.name}」を削除しますか？関連する書類もすべて削除されます。
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
        aria-label={`「${project.name}」を削除`}
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
 * 案件カード
 * -------------------------------------------------------------------------- */
const ProjectCard: React.FC<{
  project: ProjectSummary;
  canEdit: boolean;
  deleteAction: ProjectListProps['deleteAction'];
}> = ({ project, canEdit, deleteAction }) => {
  const due = formatDate(project.dueDate);
  const href = `/admin/projects/${project.id}`;

  return (
    <li className="flex flex-col rounded-lg border border-border bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-semibold leading-snug">
            <Link
              href={href}
              className="focus-ring rounded-sm text-foreground no-underline transition-colors duration-200 hover:text-accent"
            >
              {project.name}
            </Link>
          </h3>
          {project.description ? (
            <p className="line-clamp-2 font-sans text-sm text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm">
          <div className="inline-flex items-center gap-1.5">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <UserIcon className="h-4 w-4 shrink-0" />
              担当
            </dt>
            <dd className="font-medium text-foreground">
              {project.owner ?? <span className="text-muted-foreground">未設定</span>}
            </dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              期限
            </dt>
            <dd className="font-medium text-foreground">
              {due ?? <span className="text-muted-foreground">未設定</span>}
            </dd>
          </div>
        </dl>

        <div className="mt-auto">
          <ProgressMeter done={project.doneCount} total={project.documentCount} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
        <Link
          href={href}
          className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 font-sans text-sm font-semibold text-accent no-underline transition-colors duration-200 hover:bg-accent/10"
        >
          詳細・書類を見る
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        {canEdit ? <DeleteProjectButton project={project} deleteAction={deleteAction} /> : null}
      </div>
    </li>
  );
};

/* ----------------------------------------------------------------------------
 * 本体
 * -------------------------------------------------------------------------- */
export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  canEdit,
  createAction,
  deleteAction,
}) => {
  return (
    <div className="space-y-10">
      {canEdit ? (
        <section aria-labelledby="project-create-heading">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h2
              id="project-create-heading"
              className="font-heading text-xl font-semibold text-foreground"
            >
              案件を追加
            </h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              新しい案件を作成します。作成後、詳細画面で必要書類を登録できます。
            </p>
            <div className="mt-6">
              <CreateProjectForm createAction={createAction} />
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="project-list-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="project-list-heading"
            className="font-heading text-xl font-semibold text-foreground"
          >
            案件一覧
          </h2>
          <p className="font-sans text-sm text-muted-foreground">{projects.length} 件</p>
        </div>

        {projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <FolderIcon className="h-8 w-8 text-muted-foreground" />
            <p className="font-sans text-sm text-muted-foreground">
              {canEdit
                ? '案件はまだありません。上のフォームから最初の案件を作成してください。'
                : '案件はまだ登録されていません。'}
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canEdit={canEdit}
                deleteAction={deleteAction}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProjectList;
