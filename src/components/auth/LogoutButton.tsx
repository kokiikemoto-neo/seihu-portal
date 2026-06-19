'use client';
/**
 * ログアウトボタン（② UI担当, Client Component）
 *
 * 管理画面ヘッダ等に置き、③ が提供する Server Action（logoutAction, 戻り値 void）を呼ぶ。
 * - `<form action={logoutAction}>` を使い、React の useFormStatus で送信中フィードバックを出す。
 *   logoutAction 内で redirect('/login') されるため、クライアント側の遷移処理は不要。
 * - 破壊的（destructive）操作ではない通常ボタン。SVGアイコン＋「ログアウト」。
 *
 * 契約: logoutAction は引数なし・戻り値 Promise<void> の Server Action。
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/ focus-ring / 44px タッチターゲット。
 */
import type React from 'react';
import { useFormStatus } from 'react-dom';

export interface LogoutButtonProps {
  logoutAction: () => Promise<void>;
}

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
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

/**
 * 送信ボタン本体。useFormStatus は親 <form> の状態を読むため、
 * form の子コンポーネントとして分離している。
 */
const SubmitButton: React.FC = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 font-sans text-sm font-semibold text-foreground shadow-sm transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-surface"
    >
      {pending ? (
        <>
          <SpinnerIcon className="h-5 w-5" />
          ログアウト中…
        </>
      ) : (
        <>
          <LogoutIcon className="h-5 w-5" />
          ログアウト
        </>
      )}
    </button>
  );
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ logoutAction }) => {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
};

export default LogoutButton;
