'use client';
/**
 * ページ設定パネル（② UI担当 / フェーズ3D）
 *
 * ビルダーの「ページ設定」セクションで、ページの title と SEO 説明文（description）を
 * 編集・保存する。保存は ③ の Server Action（metaAction）に委譲する。
 *
 * - title / description（SEO説明文）の入力。description は約120字を目安にカウント表示。
 * - 保存ボタンは実行中ローディング表示・disabled。
 * - 保存結果（成功/失敗）は aria-live で読み上げ可能に通知。
 * - label 必須・focus-ring・44px タッチターゲット（MASTER.md / WCAG 準拠）。
 *
 * 型契約: docs/PHASE3D.md。`PageSettingsProps` を export（変更不可）。
 */
import type React from 'react';
import { useId, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from './icons';

/* =============================================================================
   契約型（docs/PHASE3D.md） — 厳守
   ============================================================================ */
export interface PageSettingsProps {
  initialTitle: string;
  initialDescription: string;
  metaAction: (meta: {
    title: string;
    description: string;
  }) => Promise<{ ok: boolean }>;
}

/** SEO説明文の推奨文字数の目安（検索結果スニペットを意識）。 */
const DESCRIPTION_GUIDE = 120;

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success' }
  | { kind: 'error' };

/* =============================================================================
   PageSettings
   ============================================================================ */
export const PageSettings: React.FC<PageSettingsProps> = ({
  initialTitle,
  initialDescription,
  metaAction,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;
  const descCountId = `${reactId}-desc-count`;

  const saving = status.kind === 'saving';
  const descLength = description.length;
  const overGuide = descLength > DESCRIPTION_GUIDE;

  const inputClass =
    'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setStatus({ kind: 'saving' });
    try {
      const result = await metaAction({ title, description });
      setStatus({ kind: result.ok ? 'success' : 'error' });
    } catch {
      setStatus({ kind: 'error' });
    }
  };

  return (
    <form
      onSubmit={handleSave}
      data-builder-panel="page-settings"
      className="space-y-5"
    >
      <p className="font-sans text-sm text-muted-foreground">
        検索エンジンや SNS 共有で表示される、ページのタイトルと説明文を設定します。
      </p>

      {/* --- ページタイトル --- */}
      <div className="space-y-1.5">
        <label
          htmlFor={titleId}
          className="font-sans text-sm font-semibold block text-foreground"
        >
          ページタイトル
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          disabled={saving}
          onChange={(e) => {
            setTitle(e.target.value);
            if (status.kind !== 'idle') setStatus({ kind: 'idle' });
          }}
          placeholder="例: くらしの手続き案内"
          className={inputClass}
        />
        <p className="font-sans text-xs text-muted-foreground">
          ブラウザのタブや検索結果の見出しに使われます（自動で「| Seihu Portal」が付きます）。
        </p>
      </div>

      {/* --- SEO説明文 --- */}
      <div className="space-y-1.5">
        <label
          htmlFor={descId}
          className="font-sans text-sm font-semibold block text-foreground"
        >
          SEO説明文（ページの概要）
        </label>
        <textarea
          id={descId}
          value={description}
          disabled={saving}
          rows={3}
          aria-describedby={descCountId}
          onChange={(e) => {
            setDescription(e.target.value);
            if (status.kind !== 'idle') setStatus({ kind: 'idle' });
          }}
          placeholder="検索結果に表示される説明文（任意）。空欄の場合はページ本文から自動生成されます。"
          className={`${inputClass} resize-y`}
        />
        <p
          id={descCountId}
          className={`font-sans text-xs ${
            overGuide ? 'text-destructive font-semibold' : 'text-muted-foreground'
          }`}
        >
          {descLength} / {DESCRIPTION_GUIDE} 字目安
          {overGuide ? '（長すぎると検索結果で省略される場合があります）' : ''}
        </p>
      </div>

      {/* --- 保存ボタン --- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-sans font-semibold text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
        >
          {saving ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : null}
          {saving ? '保存中…' : 'ページ設定を保存'}
        </button>
      </div>

      {/* --- 結果通知（aria-live, フォーカスは奪わない） --- */}
      <div aria-live="polite" role="status" className="min-h-[1.5rem]">
        {status.kind === 'success' ? (
          <p className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-success">
            <CheckCircleIcon className="h-5 w-5" />
            ページ設定を保存しました。
          </p>
        ) : null}
        {status.kind === 'error' ? (
          <p className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-destructive">
            <ExclamationCircleIcon className="h-5 w-5" />
            保存に失敗しました。再度お試しください。
          </p>
        ) : null}
      </div>
    </form>
  );
};
