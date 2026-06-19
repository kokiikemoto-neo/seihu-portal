/**
 * service-links ブロック定義（③ システム系）
 * 主要な手続き／サービスへ誘導するカードグリッドのリンク集。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/ServiceLinksBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { ServiceLinksRender, ServiceLinksEditor } from '@/components/blocks/ServiceLinksBlock';

/** サービス・手続きリンク1件（カード1枚） */
const serviceLinkItemSchema = z.object({
  /** カード見出し（サービス／手続き名） */
  title: z.string().min(1, 'タイトルを入力してください'),
  /** 補足説明（任意） */
  description: z.string().optional(),
  /** リンク先 */
  href: z.string().min(1, 'リンク先を入力してください'),
});

/** service-links ブロックの props スキーマ */
export const serviceLinksSchema = z.object({
  /** セクション見出し */
  heading: z.string().default('主な手続き・サービス'),
  /** カード項目（空配列可） */
  items: z.array(serviceLinkItemSchema).default([]),
});

export type ServiceLinksProps = z.infer<typeof serviceLinksSchema>;

const defaultProps: ServiceLinksProps = {
  heading: '主な手続き・サービス',
  items: [
    {
      title: '住民票の写しの請求',
      description: 'オンラインまたは窓口で住民票の写しを請求できます。',
      href: '/tetsuzuki/juminhyo',
    },
    {
      title: '各種税の納付',
      description: '市民税・固定資産税などの納付方法をご案内します。',
      href: '/tetsuzuki/nozei',
    },
    {
      title: '子育て・保育の相談',
      description: '保育所の申込みや子育て支援についての窓口です。',
      href: '/tetsuzuki/kosodate',
    },
  ],
};

export const serviceLinksBlock: BlockDefinition<ServiceLinksProps> = {
  type: 'service-links',
  label: 'サービス・手続きリンク集',
  schema: serviceLinksSchema,
  defaultProps,
  Render: ServiceLinksRender,
  Editor: ServiceLinksEditor,
};
