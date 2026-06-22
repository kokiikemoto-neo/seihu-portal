'use client';
/**
 * 案件詳細（② UI担当, Client Component）
 *
 * 案件の概要（名称・説明・担当・期限・進捗サマリ）と、必要書類の一覧テーブル
 * （書類名 / 種類 / 担当 / 期限 / ステータス＝StatusBadge）を表示する。
 *
 * `canEdit` の時:
 *   - 各書類のステータスを select で「即変更」（updateDocumentAction(id,{status})）。
 *     楽観的更新（即座にUI反映）＋失敗時ロールバック。
 *   - 書類の追加（フォーム）/ 編集（インライン）/ 削除（確認ステップ）。
 *   - 案件情報の編集（インラインフォーム）/ 削除（確認ステップ・destructive）。
 * `canEdit=false` の時は読み取り専用（StatusBadge 表示のみ、編集系UIは出さない）。
 *
 * 各操作は実行中ローディング（useTransition）、結果を aria-live / role="alert" で読み上げ。
 *
 * 契約:
 *   import type { ProjectDetail, DocumentItem, DocumentStatus } from '@/lib/tracking/types'。
 *   export interface ProjectDetailProps {
 *     project; canEdit; updateProjectAction; deleteProjectAction;
 *     addDocumentAction; updateDocumentAction; deleteDocumentAction
 *   }
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠（WCAG AAA 目標）。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/ label 必須 / focus-ring /
 *           44px タッチターゲット。テーブルは overflow-x-auto で横スクロール対応。
 */
import { useId, useState, useTransition } from 'react';
import Link from 'next/link';
import type React from 'react';
import type {
  ProjectDetail as ProjectDetailData,
  DocumentItem,
  DocumentStatus,
} from '@/lib/tracking/types';
import { DOCUMENT_STATUSES, DOCUMENT_STATUS_LABELS } from '@/lib/tracking/types';
import { StatusBadge } from './StatusBadge';

export interface ProjectDetailProps {
  project: ProjectDetailData;
  canEdit: boolean;
  updateProjectAction: (
    id: string,
    input: { name?: string; description?: string; owner?: string; dueDate?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteProjectAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addDocumentAction: (
    projectId: string,
    input: { name: string; docType?: string; assignee?: string; dueDate?: string; note?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  updateDocumentAction: (
    id: string,
    input: {
      name?: string;
      docType?: string;
      status?: DocumentStatus;
      assignee?: string;
      dueDate?: string;
      note?: string;
    },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteDocumentAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
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

const PencilIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

/* ----------------------------------------------------------------------------
 * 共有スタイル / ヘルパ
 * -------------------------------------------------------------------------- */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

const labelClass = 'block font-sans text-sm font-semibold text-foreground';

const primaryBtn =
  'focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-accent-foreground shadow-sm transition-colors duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent';

const secondaryBtn =
  'focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-surface px-5 py-2.5 font-sans text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60';

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

/** ISO 文字列を <input type="date"> 用の 'YYYY-MM-DD' に変換。 */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* ----------------------------------------------------------------------------
 * インライン状態通知（aria-live）
 * -------------------------------------------------------------------------- */
const StatusMessage: React.FC<{ id: string; error: string | null; success: string | null }> = ({
  id,
  error,
  success,
}) => (
  <div id={id} aria-live="polite" aria-atomic="true">
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
);

/* ----------------------------------------------------------------------------
 * 進捗サマリ
 * -------------------------------------------------------------------------- */
const ProgressSummary: React.FC<{ done: number; total: number }> = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-sm font-medium text-muted-foreground">書類の進捗</span>
        <span className="font-sans text-base font-semibold text-foreground">
          {done} / {total} 件完了
          <span className="ml-1.5 font-normal text-muted-foreground">（{pct}%）</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`書類の進捗: ${total} 件中 ${done} 件完了`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
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
 * 案件概要 ＋ 編集 / 削除（canEdit 時）
 * -------------------------------------------------------------------------- */
const ProjectOverview: React.FC<{
  project: ProjectDetailData;
  canEdit: boolean;
  updateProjectAction: ProjectDetailProps['updateProjectAction'];
  deleteProjectAction: ProjectDetailProps['deleteProjectAction'];
}> = ({ project, canEdit, updateProjectAction, deleteProjectAction }) => {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const descId = `${baseId}-desc`;
  const ownerId = `${baseId}-owner`;
  const dueId = `${baseId}-due`;
  const statusId = `${baseId}-status`;
  const confirmId = `${baseId}-confirm`;

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [owner, setOwner] = useState(project.owner ?? '');
  const [dueDate, setDueDate] = useState(toDateInput(project.dueDate));

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const due = formatDate(project.dueDate);

  function startEdit() {
    setName(project.name);
    setDescription(project.description ?? '');
    setOwner(project.owner ?? '');
    setDueDate(toDateInput(project.dueDate));
    setError(null);
    setSuccess(null);
    setEditing(true);
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
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
      const result = await updateProjectAction(project.id, {
        name: trimmedName,
        description: description.trim(),
        owner: owner.trim(),
        dueDate: dueDate,
      });
      if (result.ok) {
        setEditing(false);
        // 成功時はサーバ側 revalidate で概要が再描画される。
      } else {
        setError(result.error ?? '案件の更新に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  function handleConfirmDelete() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.ok) {
        setError(result.error ?? '削除に失敗しました。時間をおいて再度お試しください。');
        setConfirming(false);
      }
      // 成功時はサーバ側で一覧へリダイレクト / revalidate される想定。
    });
  }

  return (
    <section
      aria-labelledby="project-overview-heading"
      className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      {editing ? (
        <form onSubmit={handleSave} noValidate className="space-y-5">
          <h2
            id="project-overview-heading"
            className="font-heading text-xl font-semibold text-foreground"
          >
            案件情報を編集
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor={nameId} className={labelClass}>
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
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor={descId} className={labelClass}>
                説明
              </label>
              <textarea
                id={descId}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={3}
                className={`${inputClass} min-h-[88px] resize-y leading-relaxed`}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={ownerId} className={labelClass}>
                担当
              </label>
              <input
                id={ownerId}
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={isPending}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={dueId} className={labelClass}>
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

          <StatusMessage id={statusId} error={error} success={success} />

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={isPending} className={primaryBtn}>
              {isPending ? (
                <>
                  <SpinnerIcon className="h-5 w-5" />
                  保存中…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  変更を保存
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className={secondaryBtn}
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2
                id="project-overview-heading"
                className="font-heading text-2xl font-semibold text-foreground"
              >
                {project.name}
              </h2>
              {project.description ? (
                <p className="max-w-prose font-sans text-base text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
            {canEdit ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button type="button" onClick={startEdit} className={secondaryBtn}>
                  <PencilIcon className="h-4 w-4" />
                  編集
                </button>
              </div>
            ) : null}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-0.5">
              <dt className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                担当
              </dt>
              <dd className="font-sans text-base text-foreground">
                {project.owner ?? <span className="text-muted-foreground">未設定</span>}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                期限
              </dt>
              <dd className="font-sans text-base text-foreground">
                {due ?? <span className="text-muted-foreground">未設定</span>}
              </dd>
            </div>
          </dl>

          <div className="border-t border-border pt-5">
            <ProgressSummary done={project.doneCount} total={project.documentCount} />
          </div>

          {canEdit ? (
            <div className="border-t border-border pt-5">
              {confirming ? (
                <div
                  role="alertdialog"
                  aria-labelledby={confirmId}
                  className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4"
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
                      className={secondaryBtn}
                    >
                      キャンセル
                    </button>
                  </div>
                  <StatusMessage id={statusId} error={error} success={success} />
                </div>
              ) : (
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
                  案件を削除
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

/* ----------------------------------------------------------------------------
 * 書類のステータス select（即変更・楽観的更新＋失敗ロールバック）
 * -------------------------------------------------------------------------- */
const DocumentStatusSelect: React.FC<{
  doc: DocumentItem;
  updateDocumentAction: ProjectDetailProps['updateDocumentAction'];
}> = ({ doc, updateDocumentAction }) => {
  const baseId = useId();
  const selectId = `${baseId}-status`;
  const statusId = `${baseId}-msg`;

  const [status, setStatus] = useState<DocumentStatus>(doc.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as DocumentStatus;
    if (next === status || isPending) return;
    const previous = status;
    setError(null);
    setStatus(next); // 楽観的更新
    startTransition(async () => {
      const result = await updateDocumentAction(doc.id, { status: next });
      if (!result.ok) {
        setStatus(previous); // ロールバック
        setError(result.error ?? 'ステータスの変更に失敗しました。');
      }
      // 成功時はサーバ側 revalidate で進捗サマリも再計算される。
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <label htmlFor={selectId} className="sr-only">
        {`${doc.name} のステータス`}
      </label>
      <div className="inline-flex items-center gap-2">
        <select
          id={selectId}
          value={status}
          onChange={handleChange}
          disabled={isPending}
          aria-describedby={error ? statusId : undefined}
          className="focus-ring min-h-[44px] cursor-pointer rounded-md border border-input bg-surface px-3 py-2 font-sans text-sm text-surface-foreground transition-shadow duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {isPending ? <SpinnerIcon className="h-4 w-4 text-muted-foreground" /> : null}
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
 * 書類フィールド入力（追加 / 編集 共通）
 * -------------------------------------------------------------------------- */
interface DocFields {
  name: string;
  docType: string;
  assignee: string;
  dueDate: string;
  note: string;
}

const DocumentFields: React.FC<{
  baseId: string;
  values: DocFields;
  onChange: (next: DocFields) => void;
  disabled: boolean;
}> = ({ baseId, values, onChange, disabled }) => {
  const nameId = `${baseId}-name`;
  const typeId = `${baseId}-type`;
  const assigneeId = `${baseId}-assignee`;
  const dueId = `${baseId}-due`;
  const noteId = `${baseId}-note`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor={nameId} className={labelClass}>
          書類名
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={nameId}
          type="text"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          disabled={disabled}
          required
          autoComplete="off"
          placeholder="例: 工事請負契約書"
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={typeId} className={labelClass}>
          種類
        </label>
        <input
          id={typeId}
          type="text"
          value={values.docType}
          onChange={(e) => onChange({ ...values, docType: e.target.value })}
          disabled={disabled}
          autoComplete="off"
          placeholder="例: 契約書 / 申請書"
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={assigneeId} className={labelClass}>
          担当
        </label>
        <input
          id={assigneeId}
          type="text"
          value={values.assignee}
          onChange={(e) => onChange({ ...values, assignee: e.target.value })}
          disabled={disabled}
          autoComplete="off"
          placeholder="例: 佐藤 花子"
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={dueId} className={labelClass}>
          期限
        </label>
        <input
          id={dueId}
          type="date"
          value={values.dueDate}
          onChange={(e) => onChange({ ...values, dueDate: e.target.value })}
          disabled={disabled}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={noteId} className={labelClass}>
          メモ
        </label>
        <input
          id={noteId}
          type="text"
          value={values.note}
          onChange={(e) => onChange({ ...values, note: e.target.value })}
          disabled={disabled}
          autoComplete="off"
          placeholder="補足（任意）"
          className={inputClass}
        />
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 書類の追加フォーム（canEdit 時）
 * -------------------------------------------------------------------------- */
const emptyFields: DocFields = { name: '', docType: '', assignee: '', dueDate: '', note: '' };

const AddDocumentForm: React.FC<{
  projectId: string;
  addDocumentAction: ProjectDetailProps['addDocumentAction'];
}> = ({ projectId, addDocumentAction }) => {
  const baseId = useId();
  const statusId = `${baseId}-status`;

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<DocFields>(emptyFields);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setSuccess(null);
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setError('書類名を入力してください。');
      return;
    }
    startTransition(async () => {
      const result = await addDocumentAction(projectId, {
        name: trimmedName,
        docType: values.docType.trim() || undefined,
        assignee: values.assignee.trim() || undefined,
        dueDate: values.dueDate || undefined,
        note: values.note.trim() || undefined,
      });
      if (result.ok) {
        setSuccess(`「${trimmedName}」を追加しました。`);
        setValues(emptyFields);
      } else {
        setError(result.error ?? '書類の追加に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSuccess(null);
          setValues(emptyFields);
          setOpen(true);
        }}
        className={primaryBtn}
      >
        <PlusIcon className="h-5 w-5" />
        書類を追加
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-lg border border-border bg-surface-muted p-5"
    >
      <h3 className="font-heading text-lg font-semibold text-foreground">書類を追加</h3>
      <DocumentFields baseId={baseId} values={values} onChange={setValues} disabled={isPending} />
      <StatusMessage id={statusId} error={error} success={success} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={isPending} className={primaryBtn}>
          {isPending ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              追加中…
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              この書類を追加
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className={secondaryBtn}
        >
          閉じる
        </button>
      </div>
    </form>
  );
};

/* ----------------------------------------------------------------------------
 * 書類行の編集（インラインフォーム）
 * -------------------------------------------------------------------------- */
const EditDocumentForm: React.FC<{
  doc: DocumentItem;
  updateDocumentAction: ProjectDetailProps['updateDocumentAction'];
  onDone: () => void;
}> = ({ doc, updateDocumentAction, onDone }) => {
  const baseId = useId();
  const statusId = `${baseId}-status`;

  const [values, setValues] = useState<DocFields>({
    name: doc.name,
    docType: doc.docType ?? '',
    assignee: doc.assignee ?? '',
    dueDate: toDateInput(doc.dueDate),
    note: doc.note ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setError('書類名を入力してください。');
      return;
    }
    startTransition(async () => {
      const result = await updateDocumentAction(doc.id, {
        name: trimmedName,
        docType: values.docType.trim(),
        assignee: values.assignee.trim(),
        dueDate: values.dueDate,
        note: values.note.trim(),
      });
      if (result.ok) {
        onDone();
      } else {
        setError(result.error ?? '書類の更新に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-lg border border-accent/40 bg-surface-muted p-5"
    >
      <h4 className="font-heading text-base font-semibold text-foreground">書類を編集</h4>
      <DocumentFields baseId={baseId} values={values} onChange={setValues} disabled={isPending} />
      <StatusMessage id={statusId} error={error} success={null} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={isPending} className={primaryBtn}>
          {isPending ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              保存中…
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              変更を保存
            </>
          )}
        </button>
        <button type="button" onClick={onDone} disabled={isPending} className={secondaryBtn}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

/* ----------------------------------------------------------------------------
 * 書類行の削除（確認ステップ）
 * -------------------------------------------------------------------------- */
const DeleteDocumentButton: React.FC<{
  doc: DocumentItem;
  deleteDocumentAction: ProjectDetailProps['deleteDocumentAction'];
}> = ({ doc, deleteDocumentAction }) => {
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
      const result = await deleteDocumentAction(doc.id);
      if (!result.ok) {
        setError(result.error ?? '削除に失敗しました。時間をおいて再度お試しください。');
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-labelledby={confirmId}
        className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3"
      >
        <p id={confirmId} className="font-sans text-sm font-medium text-foreground">
          「{doc.name}」を削除しますか？
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
        aria-label={`「${doc.name}」を削除`}
        className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-transparent px-3 py-2 font-sans text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10"
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
 * 書類行（編集モードに切り替え可）
 * -------------------------------------------------------------------------- */
const DocumentRow: React.FC<{
  doc: DocumentItem;
  canEdit: boolean;
  updateDocumentAction: ProjectDetailProps['updateDocumentAction'];
  deleteDocumentAction: ProjectDetailProps['deleteDocumentAction'];
}> = ({ doc, canEdit, updateDocumentAction, deleteDocumentAction }) => {
  const [editing, setEditing] = useState(false);
  const due = formatDate(doc.dueDate);

  if (editing) {
    // 編集フォームは全幅で表示（テーブルの行をまたぐ）。
    return (
      <tr className="border-b border-border last:border-b-0">
        <td colSpan={canEdit ? 6 : 5} className="px-4 py-4">
          <EditDocumentForm
            doc={doc}
            updateDocumentAction={updateDocumentAction}
            onDone={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <th scope="row" className="px-4 py-4 font-normal">
        <span className="flex flex-col">
          <span className="font-sans text-sm font-semibold text-foreground">{doc.name}</span>
          {doc.note ? (
            <span className="font-sans text-xs text-muted-foreground">{doc.note}</span>
          ) : null}
        </span>
      </th>
      <td className="px-4 py-4 font-sans text-sm text-muted-foreground">
        {doc.docType ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-4 font-sans text-sm text-foreground">
        {doc.assignee ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-4 font-sans text-sm text-foreground">
        {due ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-4">
        {canEdit ? (
          <DocumentStatusSelect doc={doc} updateDocumentAction={updateDocumentAction} />
        ) : (
          <StatusBadge status={doc.status} />
        )}
      </td>
      {canEdit ? (
        <td className="px-4 py-4">
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`「${doc.name}」を編集`}
              className="focus-ring inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input bg-surface px-3 py-2 font-sans text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
            >
              <PencilIcon className="h-4 w-4" />
              編集
            </button>
            <DeleteDocumentButton doc={doc} deleteDocumentAction={deleteDocumentAction} />
          </div>
        </td>
      ) : null}
    </tr>
  );
};

/* ----------------------------------------------------------------------------
 * 本体
 * -------------------------------------------------------------------------- */
export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  canEdit,
  updateProjectAction,
  deleteProjectAction,
  addDocumentAction,
  updateDocumentAction,
  deleteDocumentAction,
}) => {
  const { documents } = project;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/projects"
          className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 py-2 font-sans text-sm font-semibold text-muted-foreground no-underline transition-colors duration-200 hover:text-foreground"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          案件一覧へ戻る
        </Link>
      </div>

      <ProjectOverview
        project={project}
        canEdit={canEdit}
        updateProjectAction={updateProjectAction}
        deleteProjectAction={deleteProjectAction}
      />

      <section aria-labelledby="documents-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="documents-heading" className="font-heading text-xl font-semibold text-foreground">
            必要書類
            <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
              {documents.length} 件
            </span>
          </h2>
        </div>

        {documents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface p-8 text-center font-sans text-sm text-muted-foreground">
            {canEdit
              ? 'まだ書類が登録されていません。下のボタンから追加してください。'
              : 'まだ書類が登録されていません。'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <caption className="sr-only">{project.name} の必要書類一覧</caption>
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    書類名
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    種類
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    担当
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    期限
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    ステータス
                  </th>
                  {canEdit ? (
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      操作
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    canEdit={canEdit}
                    updateDocumentAction={updateDocumentAction}
                    deleteDocumentAction={deleteDocumentAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canEdit ? (
          <div className="pt-1">
            <AddDocumentForm projectId={project.id} addDocumentAction={addDocumentAction} />
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default ProjectDetail;
