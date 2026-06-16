'use client';
/**
 * 並び替え可能なブロックアイテム（② UI担当）
 *
 * 中央プレビューの 1 ブロックを表す。役割:
 * - dnd-kit の `useSortable` でドラッグ＆ドロップ対応
 * - **DnD 以外の代替操作**として上下移動ボタンを提供（a11y / キーボード保険）
 * - 選択（クリック）で右ペインのプロパティ編集対象に
 * - 削除ボタン
 *
 * ドラッグハンドルにフォーカスして Space/Enter → 矢印キーで並び替え可能
 * （Builder 側で KeyboardSensor + sortableKeyboardCoordinates を設定）。
 */
import type React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DragHandleIcon,
  TrashIcon,
} from './icons';

export interface SortableBlockItemProps {
  id: string;
  label: string;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

export const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
  id,
  label,
  index,
  total,
  selected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const iconBtn =
    'focus-ring inline-flex items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors duration-200 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px] min-w-[44px]';

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-surface shadow-sm transition-shadow duration-200 ${
        selected ? 'border-accent ring-[3px] ring-accent/30' : 'border-border'
      } ${isDragging ? 'opacity-80 shadow-lg' : ''}`}
    >
      {/* ツールバー */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-surface-muted/50 rounded-t-lg">
        {/* ドラッグハンドル（キーボードでも掴める） */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`${label} を並び替え（Space または Enter で掴み、矢印キーで移動）`}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors duration-200 hover:bg-muted cursor-grab active:cursor-grabbing min-h-[44px] min-w-[44px] touch-none"
        >
          <DragHandleIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="focus-ring flex-1 text-left rounded-md px-2 py-1.5 font-sans text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px]"
        >
          <span className="text-muted-foreground tabular-nums">{index + 1}.</span> {label}
          {selected ? (
            <span className="ml-2 font-normal text-accent">（編集中）</span>
          ) : null}
        </button>

        {/* DnD の代替: 上下移動ボタン */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label={`${label} を上へ移動`}
          className={iconBtn}
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label={`${label} を下へ移動`}
          className={iconBtn}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${label} を削除`}
          className="focus-ring inline-flex items-center justify-center rounded-md border border-destructive/40 bg-surface text-destructive transition-colors duration-200 hover:bg-destructive/10 cursor-pointer min-h-[44px] min-w-[44px]"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* プレビュー本体（クリックで選択） */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${label} を選択して編集`}
        className="focus-ring block w-full cursor-pointer text-left"
      >
        <div className="pointer-events-none overflow-hidden rounded-b-lg">{children}</div>
      </button>
    </li>
  );
};
