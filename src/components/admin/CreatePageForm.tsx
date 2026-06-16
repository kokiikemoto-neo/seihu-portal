'use client';
/**
 * ページ新規作成フォーム（② UI担当, Client Component）
 *
 * slug / title を入力し、③ が提供する Server Action（createAction）を呼ぶ。
 * - 送信中は useTransition の isPending でローディング + 入力/ボタン disabled。
 * - 失敗時は action が返す `error` をフィールド近傍に aria-live で表示。
 * - 成功時はフォームをリセットし、成功メッセージを aria-live で通知。
 *
 * 契約: createAction は { slug, title } を受け取り {ok, id?, error?} を返す純粋な async 関数
 *       （FormData ではない）。そのため <form> の action 属性ではなく onSubmit ハンドラから直接呼ぶ。
 * デザインは MASTER.md（Accessible & Ethical, WCAG AAA 目標）準拠。label 必須 / 44px / focus-ring。
 */
import { useId, useState, useTransition } from 'react';
import type React from 'react';

export interface CreatePageFormProps {
  createAction: (input: {
    slug: string;
    title: string;
  }) => Promise<{ ok: boolean; id?: string; error?: string }>;
}

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
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
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

const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

export const CreatePageForm: React.FC<CreatePageFormProps> = ({ createAction }) => {
  const baseId = useId();
  const slugId = `${baseId}-slug`;
  const titleId = `${baseId}-title`;
  const slugHintId = `${baseId}-slug-hint`;
  const statusId = `${baseId}-status`;

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setSuccess(null);

    const trimmedSlug = slug.trim();
    const trimmedTitle = title.trim();

    // クライアント側の最低限の検証（最終判定は③のServer Actionが行う）。
    if (!trimmedTitle) {
      setError('タイトルを入力してください。');
      return;
    }
    if (!trimmedSlug) {
      setError('スラッグ（URL）を入力してください。');
      return;
    }

    startTransition(async () => {
      const result = await createAction({ slug: trimmedSlug, title: trimmedTitle });
      if (result.ok) {
        setSuccess(`「${trimmedTitle}」を作成しました。`);
        setSlug('');
        setTitle('');
      } else {
        setError(result.error ?? 'ページの作成に失敗しました。時間をおいて再度お試しください。');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={titleId} className="font-sans text-sm font-semibold block text-foreground">
          ページタイトル
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          required
          autoComplete="off"
          placeholder="例: 住民票の写しの取得について"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={slugId} className="font-sans text-sm font-semibold block text-foreground">
          スラッグ（URL）
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={slugId}
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={isPending}
          required
          autoComplete="off"
          inputMode="url"
          aria-describedby={slugHintId}
          placeholder="例: tetsuzuki/juminhyo"
          className={`${inputClass} font-mono`}
        />
        <p id={slugHintId} className="font-sans text-xs text-muted-foreground">
          半角英数字・ハイフン（-）・スラッシュ（/）で指定します。公開URLは{' '}
          <code className="font-mono text-foreground">/スラッグ</code> になります。
        </p>
      </div>

      {/* 状態通知（エラー / 成功）を aria-live で読み上げ。フィールド近傍に配置。 */}
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
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground shadow-md transition-colors duration-200 hover:bg-accent-hover cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-accent"
        >
          {isPending ? (
            <>
              <SpinnerIcon className="h-5 w-5" />
              作成中…
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              ページを作成
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreatePageForm;
