/**
 * org-guide ブロック定義（③ システム系）
 * 組織案内（部署・課の一覧）を表示する。
 *
 * 責務分離（docs/ARCHITECTURE.md）:
 *   - 定義（type / schema / defaultProps / props型）＝ ③（このファイル）
 *   - 表示・編集UI（Render / Editor）＝ ②（@/components/blocks/OrgGuideBlock）
 *
 * 依存方向: definition → component は実行時 import、component → definition は type のみ。
 */
import { z } from 'zod';
import type { BlockDefinition } from '../registry';
import { OrgGuideRender, OrgGuideEditor } from '@/components/blocks/OrgGuideBlock';

/** 部署1件（名称＋説明・リンクは任意） */
const departmentSchema = z.object({
  /** 部署・課名 */
  name: z.string().min(1, '部署名を入力してください'),
  /** 業務内容の説明（任意） */
  description: z.string().optional(),
  /** 詳細ページへのリンク（任意。②が next/link 化） */
  href: z.string().optional(),
});

/** org-guide ブロックの props スキーマ */
export const orgGuideSchema = z.object({
  /** セクション見出し */
  heading: z.string().default('組織案内'),
  /** 部署一覧（空配列可） */
  departments: z.array(departmentSchema).default([]),
});

export type OrgGuideProps = z.infer<typeof orgGuideSchema>;

const defaultProps: OrgGuideProps = {
  heading: '組織案内',
  departments: [
    {
      name: '市民課',
      description: '住民票・戸籍・マイナンバーカードなど各種証明書の発行を担当します。',
      href: '/soshiki/shimin',
    },
    {
      name: '税務課',
      description: '市民税・固定資産税などの賦課・納税相談を担当します。',
      href: '/soshiki/zeimu',
    },
    {
      name: '福祉課',
      description: '介護・障害福祉・生活支援に関する相談を担当します。',
      href: '/soshiki/fukushi',
    },
  ],
};

export const orgGuideBlock: BlockDefinition<OrgGuideProps> = {
  type: 'org-guide',
  label: '組織案内',
  schema: orgGuideSchema,
  defaultProps,
  Render: OrgGuideRender,
  Editor: OrgGuideEditor,
};
