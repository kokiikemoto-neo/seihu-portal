'use server';
/**
 * ユーザー管理の Server Actions（③ システム系 / フェーズ3F）
 *
 * Next.js 16 / React 19 の Server Functions として動作する（`'use server'`）。
 * このファイルの関数は Client Component（②の UserManager）からも import して呼び出せる。
 *
 * - listUsers:      ユーザー一覧を取得（passwordHash は返さない）
 * - createUser:     ユーザーを新規作成（email/name/password/role をバリデーション）
 * - deleteUser:     ユーザーを削除（自分自身・最後の管理者はガード）
 * - updateUserRole: ロールを変更（最後の管理者の降格はガード）
 *
 * 認証コアは @/server/auth（①）。全アクション冒頭で requireAdmin() を呼ぶ（多層防御）。
 * 管理者専用のため、未ログイン or 管理者でなければ requireAdmin が例外を投げる。
 * 変更系の成功時は revalidatePath('/admin/users') で一覧を再検証する。
 */
import { revalidatePath } from 'next/cache';
import { requireAdmin, hashPassword } from '@/server/auth';
import { prisma } from '@/server/db';

/**
 * 一覧・UI 連携用のユーザー要約。passwordHash は **含めない**。
 * createdAt は ISO 文字列、role は 'admin' | 'user' に正規化する。
 */
export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

/** DB に保存される role 文字列を 'admin' | 'user' に正規化する（既定は 'user'）。 */
function normalizeRole(role: string): 'admin' | 'user' {
  return role === 'admin' ? 'admin' : 'user';
}

/** email の形式チェック（簡易）。空白除去後に評価する。 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * ユーザー一覧を取得する。管理者専用。
 * 例外時（未ログイン / 非管理者 / DB エラー）は空配列を返す。
 * passwordHash は select で除外し、createdAt は ISO 文字列で返す。
 */
export async function listUsers(): Promise<UserSummary[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: normalizeRole(u.role),
      createdAt: u.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * ユーザーを新規作成する。管理者専用。
 * email 形式・name 必須・password 8文字以上をバリデーションし、email 重複を弾く。
 * パスワードは hashPassword でハッシュ化して保存する。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: '管理者権限が必要です。' };
  }
  try {
    const email = input.email?.trim() ?? '';
    const name = input.name?.trim() ?? '';
    const password = input.password ?? '';
    const role = normalizeRole(input.role);

    if (!email || !EMAIL_PATTERN.test(email)) {
      return { ok: false, error: '有効なメールアドレスを入力してください。' };
    }
    if (!name) {
      return { ok: false, error: '名前を入力してください。' };
    }
    if (password.length < 8) {
      return { ok: false, error: 'パスワードは8文字以上で入力してください。' };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: 'このメールアドレスは既に登録されています。' };
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { email, name, passwordHash, role },
    });

    revalidatePath('/admin/users');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ユーザーの作成に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * ユーザーを削除する。管理者専用。
 * - 自分自身（requireAdmin の id と一致）は削除不可。
 * - 最後の管理者（admin 数が 1 で対象が admin）は削除不可。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function deleteUser(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  let currentUserId: string;
  try {
    const admin = await requireAdmin();
    currentUserId = admin.id;
  } catch {
    return { ok: false, error: '管理者権限が必要です。' };
  }
  try {
    if (id === currentUserId) {
      return { ok: false, error: '自分自身は削除できません。' };
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return { ok: false, error: '対象のユーザーが見つかりません。' };
    }

    if (target.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return { ok: false, error: '最後の管理者は削除できません。' };
      }
    }

    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ユーザーの削除に失敗しました。';
    return { ok: false, error: message };
  }
}

/**
 * ユーザーのロールを変更する。管理者専用。
 * 最後の管理者を 'user' に降格しようとする場合はガードする
 * （自分自身の降格も、最後の管理者なら不可）。
 * @returns 成功可否。失敗時は error にメッセージ。
 */
export async function updateUserRole(
  id: string,
  role: 'admin' | 'user',
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: '管理者権限が必要です。' };
  }
  try {
    const nextRole = normalizeRole(role);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return { ok: false, error: '対象のユーザーが見つかりません。' };
    }

    // 管理者を利用者へ降格する場合、最後の管理者でないか確認する。
    if (target.role === 'admin' && nextRole === 'user') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return { ok: false, error: '最後の管理者は変更できません。' };
      }
    }

    await prisma.user.update({ where: { id }, data: { role: nextRole } });

    revalidatePath('/admin/users');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'ロールの変更に失敗しました。';
    return { ok: false, error: message };
  }
}
