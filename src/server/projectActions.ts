'use server';
/**
 * 案件・書類進捗の Server Actions（③ システム系 / フェーズ4）
 *
 * Next.js 16 / React 19 の Server Functions として動作する（`'use server'`）。
 * このファイルの関数は Client Component（②の ProjectList / ProjectDetail）からも
 * import して呼び出せる。
 *
 * 読み取り系（閲覧）= requireUser（全ログインユーザー）。
 * 変更系（追加・変更・削除・ステータス変更）= requireAdmin（管理者のみ。多層防御）。
 *
 * - listProjects:   案件一覧（書類の総数 / 完了数を集計）
 * - getProject:     案件詳細（書類を order 昇順で含める）
 * - createProject:  案件を新規作成（name 必須）
 * - updateProject:  案件情報を更新
 * - deleteProject:  案件を削除（書類は Cascade）
 * - addDocument:    書類を追加
 * - updateDocument: 書類を更新（ステータス変更もこれ）
 * - deleteDocument: 書類を削除
 *
 * 日付は 'YYYY-MM-DD' 文字列で受け取り、空文字は null、それ以外は new Date()。
 * 返却の dueDate / createdAt / updatedAt は ISO 文字列。型は @/lib/tracking/types に一致。
 * 変更系の成功時は revalidatePath('/admin/projects')（＋該当詳細）で再検証する。
 */
import { revalidatePath } from 'next/cache';
import { requireUser, requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import type {
  ProjectSummary,
  ProjectDetail,
  DocumentItem,
  DocumentStatus,
} from '@/lib/tracking/types';
import { DOCUMENT_STATUSES } from '@/lib/tracking/types';

const PROJECTS_PATH = '/admin/projects';

/** 変更系の権限エラー文言。 */
const FORBIDDEN = '権限がありません。';

/** DB の status 文字列を DocumentStatus に正規化する（不正値は 'not_started'）。 */
function normalizeStatus(status: string): DocumentStatus {
  return (DOCUMENT_STATUSES as string[]).includes(status)
    ? (status as DocumentStatus)
    : 'not_started';
}

/**
 * 'YYYY-MM-DD' 文字列を Date | null に変換する。
 * undefined（未指定）も null とみなす。空文字 → null、それ以外 → new Date(value)。
 */
function parseDueDate(value: string | undefined): Date | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  return new Date(trimmed);
}

/** Prisma の Document 行を DocumentItem（ISO 文字列）に整形する。 */
function toDocumentItem(doc: {
  id: string;
  projectId: string;
  name: string;
  docType: string | null;
  status: string;
  assignee: string | null;
  dueDate: Date | null;
  note: string | null;
  order: number;
}): DocumentItem {
  return {
    id: doc.id,
    projectId: doc.projectId,
    name: doc.name,
    docType: doc.docType,
    status: normalizeStatus(doc.status),
    assignee: doc.assignee,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    note: doc.note,
    order: doc.order,
  };
}

/* ============================================================
 * 読み取り系（閲覧）= requireUser
 * ============================================================ */

/**
 * 案件一覧を取得する。閲覧は全ログインユーザー。
 * 各案件の書類を集計し、documentCount（総数）/ doneCount（status==='done'）を算出する。
 * 例外時（未ログイン / DB エラー）は空配列を返す。
 */
export async function listProjects(): Promise<ProjectSummary[]> {
  try {
    await requireUser();
  } catch {
    return [];
  }
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        documents: { select: { status: true } },
      },
    });
    return projects.map((p) => {
      const documentCount = p.documents.length;
      const doneCount = p.documents.filter((d) => d.status === 'done').length;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        owner: p.owner,
        dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        documentCount,
        doneCount,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/**
 * 案件詳細を取得する。閲覧は全ログインユーザー。
 * 書類を order 昇順で含める。未ログイン or 不在 or エラー時は null。
 */
export async function getProject(id: string): Promise<ProjectDetail | null> {
  try {
    await requireUser();
  } catch {
    return null;
  }
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { order: 'asc' } },
      },
    });
    if (!project) {
      return null;
    }
    const documents = project.documents.map(toDocumentItem);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      owner: project.owner,
      dueDate: project.dueDate ? project.dueDate.toISOString() : null,
      documentCount: documents.length,
      doneCount: documents.filter((d) => d.status === 'done').length,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      documents,
    };
  } catch {
    return null;
  }
}

/* ============================================================
 * 変更系（追加・変更・削除）= requireAdmin
 * ============================================================ */

/**
 * 案件を新規作成する。管理者専用。name 必須。
 * @returns 成功可否。成功時は新規案件の id。失敗時は error にメッセージ。
 */
export async function createProject(input: {
  name: string;
  description?: string;
  owner?: string;
  dueDate?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    const name = input.name?.trim() ?? '';
    if (!name) {
      return { ok: false, error: '案件名を入力してください。' };
    }
    const description = input.description?.trim() ?? '';
    const owner = input.owner?.trim() ?? '';

    const created = await prisma.project.create({
      data: {
        name,
        description: description === '' ? null : description,
        owner: owner === '' ? null : owner,
        dueDate: parseDueDate(input.dueDate),
      },
    });

    revalidatePath(PROJECTS_PATH);
    return { ok: true, id: created.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '案件の作成に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * 案件情報を更新する。管理者専用。
 * 指定されたフィールドのみ更新する（undefined は据え置き）。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function updateProject(
  id: string,
  input: {
    name?: string;
    description?: string;
    owner?: string;
    dueDate?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    const data: {
      name?: string;
      description?: string | null;
      owner?: string | null;
      dueDate?: Date | null;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        return { ok: false, error: '案件名を入力してください。' };
      }
      data.name = name;
    }
    if (input.description !== undefined) {
      const description = input.description.trim();
      data.description = description === '' ? null : description;
    }
    if (input.owner !== undefined) {
      const owner = input.owner.trim();
      data.owner = owner === '' ? null : owner;
    }
    if (input.dueDate !== undefined) {
      data.dueDate = parseDueDate(input.dueDate);
    }

    await prisma.project.update({ where: { id }, data });

    revalidatePath(PROJECTS_PATH);
    revalidatePath(`${PROJECTS_PATH}/${id}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '案件の更新に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * 案件を削除する。管理者専用。書類は Prisma の Cascade で連動削除される。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function deleteProject(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    await prisma.project.delete({ where: { id } });

    revalidatePath(PROJECTS_PATH);
    revalidatePath(`${PROJECTS_PATH}/${id}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '案件の削除に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * 書類を案件に追加する。管理者専用。name 必須。
 * order は当該案件の既存書類数を初期値とし、末尾に追加する。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function addDocument(
  projectId: string,
  input: {
    name: string;
    docType?: string;
    assignee?: string;
    dueDate?: string;
    note?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    const name = input.name?.trim() ?? '';
    if (!name) {
      return { ok: false, error: '書類名を入力してください。' };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return { ok: false, error: '対象の案件が見つかりません。' };
    }

    const order = await prisma.document.count({ where: { projectId } });
    const docType = input.docType?.trim() ?? '';
    const assignee = input.assignee?.trim() ?? '';
    const note = input.note?.trim() ?? '';

    await prisma.document.create({
      data: {
        projectId,
        name,
        docType: docType === '' ? null : docType,
        assignee: assignee === '' ? null : assignee,
        dueDate: parseDueDate(input.dueDate),
        note: note === '' ? null : note,
        order,
      },
    });

    revalidatePath(PROJECTS_PATH);
    revalidatePath(`${PROJECTS_PATH}/${projectId}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '書類の追加に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * 書類を更新する。管理者専用。ステータス変更（status）もこの関数で行う。
 * 指定されたフィールドのみ更新する（undefined は据え置き）。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function updateDocument(
  id: string,
  input: {
    name?: string;
    docType?: string;
    status?: DocumentStatus;
    assignee?: string;
    dueDate?: string;
    note?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    const data: {
      name?: string;
      docType?: string | null;
      status?: DocumentStatus;
      assignee?: string | null;
      dueDate?: Date | null;
      note?: string | null;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        return { ok: false, error: '書類名を入力してください。' };
      }
      data.name = name;
    }
    if (input.docType !== undefined) {
      const docType = input.docType.trim();
      data.docType = docType === '' ? null : docType;
    }
    if (input.status !== undefined) {
      if (!(DOCUMENT_STATUSES as string[]).includes(input.status)) {
        return { ok: false, error: '不正なステータスです。' };
      }
      data.status = input.status;
    }
    if (input.assignee !== undefined) {
      const assignee = input.assignee.trim();
      data.assignee = assignee === '' ? null : assignee;
    }
    if (input.dueDate !== undefined) {
      data.dueDate = parseDueDate(input.dueDate);
    }
    if (input.note !== undefined) {
      const note = input.note.trim();
      data.note = note === '' ? null : note;
    }

    const updated = await prisma.document.update({
      where: { id },
      data,
      select: { projectId: true },
    });

    revalidatePath(PROJECTS_PATH);
    revalidatePath(`${PROJECTS_PATH}/${updated.projectId}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '書類の更新に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * 書類を削除する。管理者専用。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function deleteDocument(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: FORBIDDEN };
  }
  try {
    const deleted = await prisma.document.delete({
      where: { id },
      select: { projectId: true },
    });

    revalidatePath(PROJECTS_PATH);
    revalidatePath(`${PROJECTS_PATH}/${deleted.projectId}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '書類の削除に失敗しました。';
    return { ok: false, error: message };
  }
}
