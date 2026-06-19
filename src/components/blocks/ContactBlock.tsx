'use client';
/**
 * contact ブロックの表示・編集UI（② UI担当）
 *
 * - `ContactRender`: 問い合わせ先カード。tel は `tel:` リンク、email は `mailto:`
 *   リンクとして実用化。任意項目（部署・電話・メール・住所・受付時間・補足）は
 *   存在チェックして表示し、住所/受付時間はアイコンを併記（色だけに頼らない）。
 *   `<address>` を用いて連絡先であることを意味的に明示する。
 * - `ContactEditor`: 各フィールドの編集UI。任意項目は空でよい。
 *
 * props 型は ③ の定義から `import type` で取得（実行時依存を作らない）。
 * MASTER.md（Accessible & Ethical）/ WCAG AAA 準拠。絵文字不使用（SVG）。
 */
import type React from 'react';
import type { ContactProps } from '@/lib/blocks/definitions';

/* =============================================================================
   公開表示（Render）
   surface 面のカード。連絡手段ごとにアイコン＋ラベルを併記し、tel/email は
   リンク化。情報行はアイコン（装飾扱い: aria-hidden）＋ラベル＋値で構成。
   ============================================================================ */
export const ContactRender: React.FC<{ props: ContactProps }> = ({ props }) => {
  const { heading, department, tel, email, address, hours, note } = props;

  // 連絡手段が一つも無いときの控えめな表示用フラグ。
  const hasAnyDetail = Boolean(department || tel || email || address || hours || note);

  return (
    <section
      data-block="contact"
      aria-labelledby="contact-heading"
      className="bg-background text-foreground"
    >
      <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        <h2
          id="contact-heading"
          className="font-heading text-2xl font-semibold border-b border-border pb-3"
        >
          {heading}
        </h2>

        <address className="mt-6 not-italic rounded-lg border border-border bg-surface text-surface-foreground p-6 shadow-sm">
          {department ? (
            <p className="font-heading text-lg font-semibold leading-snug">
              {department}
            </p>
          ) : null}

          {!hasAnyDetail ? (
            <p className="font-sans text-base text-muted-foreground">
              連絡先はまだ登録されていません。
            </p>
          ) : null}

          <dl className={`${department ? 'mt-4' : ''} space-y-3`}>
            {tel ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  {/* phone */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <dt className="font-sans text-sm font-semibold text-muted-foreground">
                    電話
                  </dt>
                  <dd className="font-sans text-base leading-relaxed">
                    <a
                      href={`tel:${tel.replace(/\s+/g, '')}`}
                      className="focus-ring rounded-sm text-link underline-offset-2 hover:underline cursor-pointer"
                    >
                      {tel}
                    </a>
                  </dd>
                </div>
              </div>
            ) : null}

            {email ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  {/* envelope */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <dt className="font-sans text-sm font-semibold text-muted-foreground">
                    メール
                  </dt>
                  <dd className="font-sans text-base leading-relaxed break-words">
                    <a
                      href={`mailto:${email}`}
                      className="focus-ring rounded-sm text-link underline-offset-2 hover:underline cursor-pointer"
                    >
                      {email}
                    </a>
                  </dd>
                </div>
              </div>
            ) : null}

            {address ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  {/* map-pin */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <dt className="font-sans text-sm font-semibold text-muted-foreground">
                    住所
                  </dt>
                  <dd className="font-sans text-base leading-relaxed whitespace-pre-line">
                    {address}
                  </dd>
                </div>
              </div>
            ) : null}

            {hours ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
                  {/* clock */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <dt className="font-sans text-sm font-semibold text-muted-foreground">
                    受付時間
                  </dt>
                  <dd className="font-sans text-base leading-relaxed whitespace-pre-line">
                    {hours}
                  </dd>
                </div>
              </div>
            ) : null}
          </dl>

          {note ? (
            <p className="mt-4 border-t border-border pt-4 font-sans text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {note}
            </p>
          ) : null}
        </address>
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

/** 共通: ラベル付き入力（単一行 / 複数行）。 */
const Field: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  hint?: string;
}> = ({ id, label, value, onChange, placeholder, type = 'text', multiline, hint }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="font-sans text-sm font-semibold block text-foreground">
      {label}
    </label>
    {multiline ? (
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y`}
      />
    ) : (
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    )}
    {hint ? <p className="font-sans text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

export const ContactEditor: React.FC<{
  props: ContactProps;
  onChange: (next: ContactProps) => void;
}> = ({ props, onChange }) => {
  return (
    <div data-block-editor="contact" className="space-y-5">
      <Field
        id="contact-heading"
        label="セクション見出し"
        value={props.heading}
        onChange={(v) => onChange({ ...props, heading: v })}
        placeholder="例: お問い合わせ先"
      />

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="font-sans text-sm font-semibold px-1 text-foreground">
          連絡先の詳細（任意項目は空欄で非表示）
        </legend>

        <Field
          id="contact-department"
          label="担当部署（任意）"
          value={props.department ?? ''}
          onChange={(v) => onChange({ ...props, department: v })}
          placeholder="例: 市民課 住民記録係"
        />
        <Field
          id="contact-tel"
          label="電話番号（任意）"
          type="tel"
          value={props.tel ?? ''}
          onChange={(v) => onChange({ ...props, tel: v })}
          placeholder="例: 03-1234-5678"
          hint="表示時に tel: リンクになります。"
        />
        <Field
          id="contact-email"
          label="メールアドレス（任意）"
          type="email"
          value={props.email ?? ''}
          onChange={(v) => onChange({ ...props, email: v })}
          placeholder="例: shimin@example.lg.jp"
          hint="表示時に mailto: リンクになります。"
        />
        <Field
          id="contact-address"
          label="住所（任意）"
          value={props.address ?? ''}
          onChange={(v) => onChange({ ...props, address: v })}
          placeholder="例: 〇〇県〇〇市本町1-2-3 市役所本庁舎2階"
          multiline
        />
        <Field
          id="contact-hours"
          label="受付時間（任意）"
          value={props.hours ?? ''}
          onChange={(v) => onChange({ ...props, hours: v })}
          placeholder="例: 平日 8:30〜17:15（土日祝・年末年始を除く）"
          multiline
        />
        <Field
          id="contact-note"
          label="補足（任意）"
          value={props.note ?? ''}
          onChange={(v) => onChange({ ...props, note: v })}
          placeholder="例: 来庁の際は本人確認書類をお持ちください。"
          multiline
        />
      </fieldset>
    </div>
  );
};
