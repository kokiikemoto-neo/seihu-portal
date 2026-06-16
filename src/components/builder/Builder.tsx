'use client';
/**
 * ページビルダー本体（② UI担当）
 *
 * 3ペイン構成:
 *  - 左: ブロックパレット（getAllBlockDefinitions() の label。クリックで末尾追加）
 *  - 中央: 配置プレビュー＋並び替え（@dnd-kit/sortable, KeyboardSensor 対応, 上下移動ボタン, 削除）
 *  - 右: 選択ブロックのプロパティ編集（getBlockDefinition(type).Editor）
 *  - 上部: 下書き保存（saveAction） / 公開（publishAction）。実行中ローディング＋結果メッセージ。
 *
 * 型契約: docs/PHASE2.md。`BuilderProps` を export（③のページが合わせる）。
 * a11y: フォーカス管理 / 44px ターゲット / DnD のキーボード代替 / aria-live トースト。
 */
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BlockInstance, BlockType, PageLayout } from '@/lib/blocks/types';
import { getAllBlockDefinitions, getBlockDefinition } from '@/lib/blocks/registry';
import { SortableBlockItem } from './SortableBlockItem';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  SquaresPlusIcon,
} from './icons';

/* =============================================================================
   契約型（docs/PHASE2.md）
   ============================================================================ */
export interface BuilderProps {
  pageId: string;
  pageTitle: string;
  initialLayout: PageLayout;
  /** ③ の Server Action: 下書き保存 */
  saveAction: (layout: PageLayout) => Promise<{ ok: boolean }>;
  /** ③ の Server Action: 公開 */
  publishAction: () => Promise<{ ok: boolean }>;
}

/* =============================================================================
   ユーティリティ
   ============================================================================ */
let idCounter = 0;
/** ブロックインスタンスのユニークID採番。 */
function generateInstanceId(type: BlockType): string {
  idCounter += 1;
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${type}-${rand}-${idCounter}`;
}

type Toast = { kind: 'success' | 'error'; message: string } | null;

/* =============================================================================
   Builder
   ============================================================================ */
export function Builder(props: BuilderProps): React.ReactElement {
  const { pageTitle, initialLayout, saveAction, publishAction } = props;

  const [layout, setLayout] = useState<PageLayout>(initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLayout[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const definitions = useMemo(() => getAllBlockDefinitions(), []);

  const showToast = useCallback((next: NonNullable<Toast>) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const sensors = useSensors(
    // 小移動でのドラッグ誤発火を避ける（drag-threshold）。
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // キーボードでの並び替え（必須要件）。
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedIndex = layout.findIndex((b) => b.id === selectedId);
  const selectedBlock = selectedIndex >= 0 ? layout[selectedIndex] : null;

  /* --- 状態更新ヘルパ --- */
  const commit = useCallback((next: PageLayout) => {
    setLayout(next);
    setDirty(true);
  }, []);

  const addBlock = useCallback(
    (type: BlockType) => {
      const def = getBlockDefinition(type);
      if (!def) return;
      const instance: BlockInstance = {
        id: generateInstanceId(type),
        type,
        // defaultProps は構造化複製してインスタンス間で共有しない。
        props: structuredClone(def.defaultProps) as Record<string, unknown>,
      };
      commit([...layout, instance]);
      setSelectedId(instance.id);
    },
    [layout, commit],
  );

  const removeBlock = useCallback(
    (id: string) => {
      const idx = layout.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const next = layout.filter((b) => b.id !== id);
      commit(next);
      if (selectedId === id) {
        // 削除後は隣接ブロックを選択（フォーカス迷子を防ぐ）。
        const fallback = next[idx] ?? next[idx - 1] ?? null;
        setSelectedId(fallback ? fallback.id : null);
      }
    },
    [layout, selectedId, commit],
  );

  const moveBlock = useCallback(
    (id: string, direction: -1 | 1) => {
      const idx = layout.findIndex((b) => b.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= layout.length) return;
      commit(arrayMove(layout, idx, target));
    },
    [layout, commit],
  );

  const updateSelectedProps = useCallback(
    (nextProps: unknown) => {
      if (!selectedBlock) return;
      const next = layout.map((b) =>
        b.id === selectedBlock.id
          ? { ...b, props: nextProps as Record<string, unknown> }
          : b,
      );
      commit(next);
    },
    [layout, selectedBlock, commit],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const from = layout.findIndex((b) => b.id === active.id);
      const to = layout.findIndex((b) => b.id === over.id);
      if (from < 0 || to < 0) return;
      commit(arrayMove(layout, from, to));
    },
    [layout, commit],
  );

  /* --- 保存 / 公開 --- */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await saveAction(layout);
      if (result.ok) {
        setDirty(false);
        showToast({ kind: 'success', message: '下書きを保存しました。' });
      } else {
        showToast({ kind: 'error', message: '保存に失敗しました。再度お試しください。' });
      }
    } catch {
      showToast({ kind: 'error', message: '保存中にエラーが発生しました。' });
    } finally {
      setSaving(false);
    }
  }, [layout, saveAction, showToast]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      // 公開前に未保存の編集を保存してから公開する（公開は保存済み draft を対象にするため）。
      if (dirty) {
        const saved = await saveAction(layout);
        if (!saved.ok) {
          showToast({ kind: 'error', message: '公開前の保存に失敗しました。' });
          return;
        }
        setDirty(false);
      }
      const result = await publishAction();
      if (result.ok) {
        showToast({ kind: 'success', message: 'ページを公開しました。' });
      } else {
        showToast({ kind: 'error', message: '公開に失敗しました。再度お試しください。' });
      }
    } catch {
      showToast({ kind: 'error', message: '公開中にエラーが発生しました。' });
    } finally {
      setPublishing(false);
    }
  }, [dirty, layout, saveAction, publishAction, showToast]);

  const busy = saving || publishing;
  const itemIds = useMemo(() => layout.map((b) => b.id), [layout]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ===== 上部ツールバー ===== */}
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="font-sans text-xs opacity-90">ページビルダー</p>
            <h1 className="font-heading text-xl font-bold truncate">
              {pageTitle}
              {dirty ? (
                <span className="ml-2 align-middle font-sans text-xs font-medium opacity-90">
                  ・未保存の変更
                </span>
              ) : null}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              aria-busy={saving}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary-foreground/50 bg-transparent px-5 py-2.5 font-sans font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {saving ? <Spinner label="保存中" /> : null}
              下書き保存
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              aria-busy={publishing}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 font-sans font-semibold text-accent-foreground shadow-md transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {publishing ? <Spinner label="公開中" /> : null}
              公開する
            </button>
          </div>
        </div>
      </header>

      {/* ===== トースト（aria-live, フォーカスを奪わない） ===== */}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
      >
        {toast ? (
          <div
            className={`pointer-events-auto flex items-center gap-2 rounded-md px-4 py-3 font-sans text-sm font-semibold shadow-lg ${
              toast.kind === 'success'
                ? 'bg-success text-success-foreground'
                : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {toast.kind === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            {toast.message}
          </div>
        ) : null}
      </div>

      {/* ===== 3ペイン ===== */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* --- 左: パレット --- */}
        <aside aria-labelledby="palette-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <h2
              id="palette-heading"
              className="font-heading text-base font-semibold text-foreground"
            >
              ブロックを追加
            </h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              クリックでページ末尾に追加します。
            </p>
            <ul className="mt-3 space-y-2">
              {definitions.map((def) => (
                <li key={def.type}>
                  <button
                    type="button"
                    onClick={() => addBlock(def.type)}
                    className="focus-ring flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-left font-sans text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted cursor-pointer min-h-[44px]"
                  >
                    <PlusIcon className="h-4 w-4 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">{def.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* --- 中央: プレビュー＋並び替え --- */}
        <main aria-labelledby="canvas-heading" className="min-w-0">
          <h2 id="canvas-heading" className="sr-only">
            ページプレビューと配置
          </h2>
          {layout.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface px-6 py-16 text-center">
              <SquaresPlusIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-heading text-lg font-semibold text-foreground">
                まだブロックがありません
              </p>
              <p className="mt-1 font-sans text-sm text-muted-foreground">
                左の「ブロックを追加」から配置を始めてください。
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <ul className="space-y-4">
                  {layout.map((block, index) => {
                    const def = getBlockDefinition(block.type);
                    const label = def?.label ?? block.type;
                    const Render = def?.Render;
                    return (
                      <SortableBlockItem
                        key={block.id}
                        id={block.id}
                        label={label}
                        index={index}
                        total={layout.length}
                        selected={block.id === selectedId}
                        onSelect={() => setSelectedId(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        onMoveUp={() => moveBlock(block.id, -1)}
                        onMoveDown={() => moveBlock(block.id, 1)}
                      >
                        {Render ? (
                          <Render props={block.props} />
                        ) : (
                          <div className="p-4 font-sans text-sm text-muted-foreground">
                            未対応のブロック: {block.type}
                          </div>
                        )}
                      </SortableBlockItem>
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </main>

        {/* --- 右: プロパティ編集 --- */}
        <aside aria-labelledby="props-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <h2
              id="props-heading"
              className="font-heading text-base font-semibold text-foreground border-b border-border pb-2"
            >
              プロパティ
            </h2>

            {selectedBlock ? (
              <PropertiesPanel
                key={selectedBlock.id}
                block={selectedBlock}
                onChange={updateSelectedProps}
              />
            ) : (
              <p className="mt-4 font-sans text-sm text-muted-foreground">
                編集するブロックを中央のプレビューから選択してください。
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* =============================================================================
   プロパティパネル（選択ブロックの Editor を解決して描画）
   ============================================================================ */
const PropertiesPanel: React.FC<{
  block: BlockInstance;
  onChange: (next: unknown) => void;
}> = ({ block, onChange }) => {
  const def = getBlockDefinition(block.type);
  if (!def) {
    return (
      <p className="mt-4 font-sans text-sm text-muted-foreground">
        このブロック（{block.type}）の編集UIは未登録です。
      </p>
    );
  }
  const Editor = def.Editor;
  return (
    <div className="mt-4">
      <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {def.label}
      </p>
      <Editor props={block.props} onChange={onChange} />
    </div>
  );
};

/* =============================================================================
   ローディングスピナー（reduced-motion 尊重: CSS の motion 抑制が効く）
   ============================================================================ */
const Spinner: React.FC<{ label: string }> = ({ label }) => (
  <>
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
    <span className="sr-only">{label}</span>
  </>
);
