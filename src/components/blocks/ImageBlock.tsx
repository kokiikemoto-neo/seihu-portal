'use client';
/**
 * image ブロックの表示・編集UI（② UI担当）
 *
 * - `ImageRender`: 画像表示。`next/image` を **`unoptimized`** で使用し、任意URL
 *   （外部・内部）をドメイン設定なしでそのまま配信する。
 *   src が空のときは「画像未設定」プレースホルダを表示。alt は必ず適用
 *   （装飾画像は空文字でも可）。caption があれば `<figure>/<figcaption>`、
 *   無ければ単独の画像として表示。
 * - `ImageEditor`: src / alt / caption の編集UIと簡易プレビュー。
 *
 * Next.js 16 の next/image: 任意URLは width/height か fill が必須。ここでは
 * 画像の実寸が不明でもレイアウトシフトを起こさないよう、`position:relative` な
 * アスペクト比コンテナ内で `fill` + `object-contain` を用いる（max-width:100%
 * のレスポンシブも担保）。
 *
 * props 型は ③ の定義から `import type` で取得。MASTER.md / WCAG AAA 準拠。
 * 絵文字不使用（SVG）。
 */
import type React from 'react';
import Image from 'next/image';
import type { ImageProps } from '@/lib/blocks/definitions';

/* =============================================================================
   公開表示（Render）
   ============================================================================ */
export const ImageRender: React.FC<{ props: ImageProps }> = ({ props }) => {
  const { src, alt, caption } = props;

  // 画像本体（src なし=プレースホルダ）。アスペクト比コンテナで CLS を防ぐ。
  const media = src ? (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted aspect-[16/9]">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-contain"
      />
    </div>
  ) : (
    <div
      role="img"
      aria-label={alt || '画像未設定'}
      className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground"
    >
      {/* photo / picture icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-10 w-10"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <span className="font-sans text-sm font-medium">画像未設定</span>
    </div>
  );

  return (
    <section data-block="image" className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-8 md:py-10">
        {caption ? (
          <figure className="m-0">
            {media}
            <figcaption className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
              {caption}
            </figcaption>
          </figure>
        ) : (
          media
        )}
      </div>
    </section>
  );
};

/* =============================================================================
   編集UI（Editor）
   ============================================================================ */
const inputClass =
  'w-full rounded-md border border-input bg-surface text-surface-foreground px-3 py-2.5 text-base outline-none transition-shadow duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/30 min-h-[44px]';

export const ImageEditor: React.FC<{
  props: ImageProps;
  onChange: (next: ImageProps) => void;
}> = ({ props, onChange }) => {
  return (
    <div data-block-editor="image" className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="image-src"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          画像URL
        </label>
        <input
          id="image-src"
          type="url"
          value={props.src}
          placeholder="例: https://example.com/photo.jpg または /images/photo.jpg"
          onChange={(e) => onChange({ ...props, src: e.target.value })}
          className={inputClass}
        />
        <p className="font-sans text-xs text-muted-foreground">
          空のままにすると公開ページでは「画像未設定」と表示されます。
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="image-alt"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          代替テキスト（alt）
        </label>
        <input
          id="image-alt"
          type="text"
          value={props.alt}
          placeholder="例: 市役所本庁舎の外観"
          onChange={(e) => onChange({ ...props, alt: e.target.value })}
          className={inputClass}
        />
        <p className="font-sans text-xs text-muted-foreground">
          画像の内容を簡潔に説明します。装飾目的の画像は空欄でも構いません。
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="image-caption"
          className="font-sans text-sm font-semibold block text-foreground"
        >
          キャプション（任意）
        </label>
        <input
          id="image-caption"
          type="text"
          value={props.caption ?? ''}
          placeholder="例: 写真: 〇〇市提供"
          onChange={(e) => onChange({ ...props, caption: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* 簡易プレビュー（Render と同じ表示ロジックを再利用） */}
      <div className="space-y-1.5">
        <span className="font-sans text-sm font-semibold block text-foreground">
          プレビュー
        </span>
        <div className="rounded-lg border border-border bg-surface p-4">
          <ImageRender props={props} />
        </div>
      </div>
    </div>
  );
};
