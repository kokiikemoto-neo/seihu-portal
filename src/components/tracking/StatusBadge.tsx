/**
 * 書類ステータスバッジ（② UI担当）
 *
 * `DocumentStatus` を「色 ＋ ラベル ＋ アイコン」のバッジで表す。
 *   - 未着手(not_started) = muted 系
 *   - 作成中(in_progress) = accent 系
 *   - 確認中(reviewing)   = warning 系
 *   - 完了(done)         = success 系
 * 色だけに依存せず、`DOCUMENT_STATUS_LABELS` のテキストと形状の異なる
 * インラインSVGアイコンを併記して区別する（色覚配慮 / WCAG）。
 *
 * 契約: `export interface StatusBadgeProps { status: DocumentStatus }`。
 * デザイン: ui-ux-pro-max「Accessible & Ethical」起点・MASTER.md準拠。
 *           トークンのみ（生hex禁止）/ 絵文字禁止（インラインSVG）。
 */
import type React from 'react';
import type { DocumentStatus } from '@/lib/tracking/types';
import { DOCUMENT_STATUS_LABELS } from '@/lib/tracking/types';

export interface StatusBadgeProps {
  status: DocumentStatus;
}

type IconProps = { className?: string };

/** 未着手: 空の円。 */
const CircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-3.5 w-3.5'}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.25" />
  </svg>
);

/** 作成中: 鉛筆。 */
const PencilIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-3.5 w-3.5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
    />
  </svg>
);

/** 確認中: 虫眼鏡。 */
const SearchIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-3.5 w-3.5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

/** 完了: チェック付き円。 */
const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className ?? 'h-3.5 w-3.5'}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface StatusStyle {
  /** バッジの配色（境界・背景・前景）。トークンのみ。 */
  className: string;
  Icon: React.FC<IconProps>;
}

const STATUS_STYLES: Record<DocumentStatus, StatusStyle> = {
  not_started: {
    className: 'border-border bg-muted text-muted-foreground',
    Icon: CircleIcon,
  },
  in_progress: {
    className: 'border-accent/40 bg-accent/10 text-accent',
    Icon: PencilIcon,
  },
  reviewing: {
    className: 'border-warning/40 bg-warning/10 text-warning',
    Icon: SearchIcon,
  },
  done: {
    className: 'border-success/40 bg-success/10 text-success',
    Icon: CheckCircleIcon,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { className, Icon } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
