/**
 * ブロックレジストリ（③ システム系）
 *
 * ブロックの「定義」を type 名で登録・解決する仕組み。
 * 1ブロック = 1 BlockDefinition を登録するだけで、ビルダー・レンダラ双方が
 * 同じレジストリを参照して動作する（単一の Source of Truth）。
 *
 * - 型・スキーマ・デフォルト値（schema / defaultProps）は ③ が定義
 * - 表示・編集UI（Render / Editor）は ② が実装（現状は素のプレースホルダ）
 *
 * 共有契約は src/lib/blocks/types.ts（①管理）を import する。重複定義しない。
 */
import type { ZodType } from 'zod';
import type React from 'react';
import type { BlockType } from './types';

/**
 * 1種類のブロックの完全な定義。
 * @typeParam TProps - このブロックの props 型（schema/defaultProps と一致させる）
 */
export interface BlockDefinition<TProps = Record<string, unknown>> {
  /** ブロック種別（types.ts の BlockType と一致） */
  type: BlockType;
  /** 一覧・パネルでの表示名 */
  label: string;
  /** props バリデーション用 zod スキーマ */
  schema: ZodType<TProps>;
  /** 新規配置時の初期 props */
  defaultProps: TProps;
  /** 公開表示用コンポーネント（②が見た目を実装） */
  Render: React.FC<{ props: TProps }>;
  /** ビルダーの編集UI（②が見た目を実装） */
  Editor: React.FC<{ props: TProps; onChange: (next: TProps) => void }>;
}

/**
 * type → 定義 の対応表。
 * 値の TProps はブロックごとに異なるため unknown で保持し、取得時に呼び出し側が型を補う。
 */
const registry = new Map<BlockType, BlockDefinition<unknown>>();

/**
 * ブロック定義を登録する。
 * 同じ type が既に登録済みの場合は上書きし、開発時のみ警告する（HMR の二重登録対策）。
 */
export function registerBlock<TProps>(definition: BlockDefinition<TProps>): void {
  if (process.env.NODE_ENV !== 'production' && registry.has(definition.type)) {
    console.warn(
      `[blocks] ブロック定義 "${definition.type}" が既に登録されています。上書きします。`,
    );
  }
  // TProps はブロックごとに異なるため、レジストリ内部では unknown に正規化して保持する。
  registry.set(definition.type, definition as unknown as BlockDefinition<unknown>);
}

/**
 * type に対応するブロック定義を取得する。未登録なら undefined。
 * 呼び出し側は undefined チェックを行うこと（未知 type に安全）。
 */
export function getBlockDefinition(type: BlockType): BlockDefinition<unknown> | undefined {
  return registry.get(type);
}

/** 登録済みの全ブロック定義を取得する（ビルダーのブロック一覧などで使用）。 */
export function getAllBlockDefinitions(): BlockDefinition<unknown>[] {
  return Array.from(registry.values());
}

/** テスト・再初期化用にレジストリを空にする。 */
export function clearRegistry(): void {
  registry.clear();
}
