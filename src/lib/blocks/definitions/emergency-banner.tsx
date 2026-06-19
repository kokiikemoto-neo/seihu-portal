/**
 * emergency-banner ブロック定義（③ システム系）
 * 災害・緊急のお知らせをページ最上部で強く告知する緊急情報バナー。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/EmergencyBannerBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 * 注: level は色だけに依存せずアイコン・ラベルでも区別する（a11y は②の見た目実装で担保）。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { EmergencyBannerRender, EmergencyBannerEditor } from '@/components/blocks/EmergencyBannerBlock';

/** emergency-banner ブロックの props スキーマ */
export const emergencyBannerSchema = z.object({
  /** 重大度（②が色・アイコン・ラベルで区別。色のみに依存しない） */
  level: z.enum(['info', 'warning', 'emergency']).default('emergency'),
  /** 見出し */
  title: z.string().min(1, '見出しを入力してください'),
  /** 本文（告知内容） */
  message: z.string().min(1, '本文を入力してください'),
  /** 詳細リンクのラベル（任意） */
  linkLabel: z.string().optional(),
  /** 詳細リンクのリンク先（任意） */
  linkHref: z.string().optional(),
});

export type EmergencyBannerProps = z.infer<typeof emergencyBannerSchema>;

const defaultProps: EmergencyBannerProps = {
  level: 'emergency',
  title: '【緊急】大雨に関する避難情報',
  message: '土砂災害の危険が高まっています。お住まいの地域の避難情報を確認し、早めに安全を確保してください。',
  linkLabel: '避難情報の詳細を見る',
  linkHref: '/bousai/hinan',
};

export const emergencyBannerBlock: BlockDefinition<EmergencyBannerProps> = {
  type: 'emergency-banner',
  label: '緊急情報バナー',
  schema: emergencyBannerSchema,
  defaultProps,
  Render: EmergencyBannerRender,
  Editor: EmergencyBannerEditor,
};
