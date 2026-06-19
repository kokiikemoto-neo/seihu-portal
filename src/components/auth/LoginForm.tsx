'use client';
/**
 * 編集者ログインフォーム（② UI担当, Client Component）
 *
 * `/login`（公開）で表示し、③ が提供する Server Action（loginAction）を呼ぶ。
 * - email / password を入力。送信中は useTransition の isPending でローディング + 入力/ボタン disabled。
 * - 失敗時は action が返す `error` を role="alert" / aria-live でフォーム上部に表示。
 * - 成功（ok）時は `useRouter().replace(redirectTo)`（next/navigation）でクライアント遷移する。
 *   replace を使うことでログイン画面を履歴に残さない（戻るボタンで戻れない）。
 *
 * 契約: loginAction は { email, password } を受け取り {ok, error?} を返す純粋な async 関数
 *       （FormData ではない）。そのため <form> の action 属性ではなく onSubmit から直接呼ぶ。
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠（WCAG AAA 目標）。
 *           中央寄せカードの政府ログイン画面。トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）/
 *           label 必須 / focus-ring / 44px タッチターゲット。
 */
import { useId, useState, useTransition } from 'react';
import type React from 'react';
import { useRouter } from 'next/navigation';

export interface LoginFormProps {
  loginAction: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  redirectTo: string;
}

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-7 w-7'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.285z"
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

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={className ?? 'h-5 w-5'}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-4 py-3 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed';

export const LoginForm: React.FC<LoginFormProps> = ({ loginAction, redirectTo }) => {
  const router = useRouter();
  const baseId = useId();
  const emailId = `${baseId}-email`;
  const passwordId = `${baseId}-password`;
  const errorId = `${baseId}-error`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    const trimmedEmail = email.trim();

    // クライアント側の最低限の検証（最終判定は③のServer Actionが行う）。
    if (!trimmedEmail) {
      setError('メールアドレスを入力してください。');
      return;
    }
    if (!password) {
      setError('パスワードを入力してください。');
      return;
    }

    startTransition(async () => {
      const result = await loginAction({ email: trimmedEmail, password });
      if (result.ok) {
        // 成功時はログイン画面を履歴に残さず遷移する。
        router.replace(redirectTo);
      } else {
        setError(
          result.error ?? 'ログインに失敗しました。時間をおいて再度お試しください。',
        );
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-lg sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldIcon className="h-7 w-7" />
          </span>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Seihu Portal</h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            管理画面にアクセスするにはログインしてください。
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* 状態通知（エラー）を aria-live / role=alert で読み上げ。フォーム上部に配置。 */}
          <div id={errorId} aria-live="assertive" aria-atomic="true">
            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 font-sans text-sm font-medium text-destructive"
              >
                <ExclamationIcon className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={emailId}
              className="block font-sans text-sm font-semibold text-foreground"
            >
              メールアドレス
            </label>
            <input
              id={emailId}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="例: admin@example.go.jp"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={passwordId}
              className="block font-sans text-sm font-semibold text-foreground"
            >
              パスワード
            </label>
            <input
              id={passwordId}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-sans font-semibold text-accent-foreground shadow-md transition-colors duration-200 hover:bg-accent-hover cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-accent"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="h-5 w-5" />
                ログイン中…
              </>
            ) : (
              <>
                ログイン
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
