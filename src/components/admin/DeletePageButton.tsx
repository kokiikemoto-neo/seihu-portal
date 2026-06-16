'use client';
/**
 * ページ削除ボタン（② UI担当, Client Component）
 *
 * 破壊的操作。クリックで即削除せず、インラインの「確認ステップ」を挟む:
 *   1. 「削除」ボタン → 確認UI（「本当に『{pageTitle}』を削除しますか？」＋ 削除する / キャンセル）
 *   2. 「削除する」確定 → deleteAction(pageId) を実行（実行中ローディング）
 *
 * - destructive 色で他操作と視覚分離。
 * - 確認UIは role="alertdialog" 相当の領域として aria でグルーピング。
 * - 失敗時は近傍に aria-live で簡潔なエラーを表示。
 *
 * 契約: deleteAction は pageId(string) を受け取り {ok} を返す純粋な async 関数（FormData ではない）。
 *       そのため onClick ハンドラから直接呼ぶ。
 * デザインは MASTER.md（Accessible & Ethical）準拠。44px / focus-ring。
 */
import { useId, useState, useTransition } from 'react';
import type React from 'react';

export interface DeletePageButtonProps {
  pageId: string;
  pageTitle: string;
  deleteAction: (id: string) => Promise<{ ok: boolean }>;
}

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

export const DeletePageButton: React.FC<DeletePageButtonProps> = ({
  pageId,
  pageTitle,
  deleteAction,
}) => {
  const baseId = useId();
  const confirmId = `${baseId}-confirm`;
  const errorId = `${baseId}-error`;

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAction(pageId);
      if (!result.ok) {
        setError('削除に失敗しました。時間をおいて再度お試しください。');
        setConfirming(false);
      }
      // 成功時はサーバ側 revalidate で一覧が再描画され、この行は消える。
    });
  }

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-labelledby={confirmId}
        className="inline-flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 sm:flex-row sm:items-center"
      >
        <p id={confirmId} className="font-sans text-sm font-medium text-foreground">
          本当に「{pageTitle}」を削除しますか？
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-4 py-2.5 font-sans text-sm font-semibold text-destructive-foreground shadow-sm transition-opacity duration-200 hover:opacity-90 cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="focus-ring inline-flex items-center justify-center rounded-md border border-input bg-surface px-4 py-2.5 font-sans text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        aria-label={`「${pageTitle}」を削除`}
        className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10 cursor-pointer min-h-[44px]"
      >
        <TrashIcon className="h-4 w-4" />
        削除
      </button>
      <span id={errorId} aria-live="polite" aria-atomic="true">
        {error ? (
          <span role="alert" className="font-sans text-xs font-medium text-destructive">
            {error}
          </span>
        ) : null}
      </span>
    </div>
  );
};

export default DeletePageButton;
