/**
 * 案件・書類進捗の共有契約（① 全体管理）
 *
 * UIと永続化/アクションの境界となる型。②③はここから import する。
 */

/** 書類の進捗ステータス。 */
export type DocumentStatus = 'not_started' | 'in_progress' | 'reviewing' | 'done';

/** ステータスの表示順（一覧の集計・選択肢の並びに使用）。 */
export const DOCUMENT_STATUSES: DocumentStatus[] = [
  'not_started',
  'in_progress',
  'reviewing',
  'done',
];

/** ステータスの日本語ラベル。 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  not_started: '未着手',
  in_progress: '作成中',
  reviewing: '確認中',
  done: '完了',
};

/** 書類1件。 */
export interface DocumentItem {
  id: string;
  projectId: string;
  name: string;
  docType: string | null;
  status: DocumentStatus;
  assignee: string | null;
  /** ISO 8601 文字列 or null */
  dueDate: string | null;
  note: string | null;
  order: number;
}

/** 案件一覧用のサマリ（書類は件数のみ）。 */
export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  dueDate: string | null;
  /** 書類の総数 */
  documentCount: number;
  /** status==='done' の件数 */
  doneCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 案件詳細（書類一覧つき）。 */
export interface ProjectDetail extends ProjectSummary {
  documents: DocumentItem[];
}
