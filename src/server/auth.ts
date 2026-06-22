/**
 * 認証コア（① 全体管理／セキュリティ）
 *
 * - パスワードハッシュ: bcryptjs
 * - セッション: 署名付きJWT（jose, HS256）を httpOnly Cookie に格納
 * - サーバー側（Server Actions / Server Components）専用。Cookie 書き込みは
 *   Server Action / Route Handler のみ可能（RSC レンダリング中は読み取りのみ）。
 *
 * ルート保護は middleware.ts（Cookie の JWT 検証）と、各 admin Server Action 内の
 * requireUser()（多層防御）で行う。
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'seihu_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7日

/** セッションに格納する最小のユーザー情報。 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET が未設定または短すぎます（.env に十分長いランダム値を設定してください）。',
    );
  }
  return new TextEncoder().encode(secret);
}

/* --- パスワード --- */

/** 平文パスワードをハッシュ化する。 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/** 平文パスワードとハッシュを照合する。 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* --- セッショントークン（JWT） --- */

/** ユーザー情報から署名付きセッショントークンを生成する。 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** トークンを検証して SessionUser を返す（無効なら null）。 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: String(payload.role ?? 'editor'),
    };
  } catch {
    return null;
  }
}

/* --- Cookie 操作（Server Action / Route Handler 専用） --- */

/** セッションCookieを発行する（ログイン時）。 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** セッションCookieを破棄する（ログアウト時）。 */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* --- 現在のユーザー取得 / 保護 --- */

/** 現在のログインユーザーを返す（未ログインなら null）。RSC / Server Action で利用可。 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * ログイン必須の処理で呼ぶ。未ログインなら例外を投げる（多層防御）。
 * admin の Server Action 冒頭で必ず呼ぶこと。
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: ログインが必要です。');
  }
  return user;
}

/** ロール定数。'admin'=管理者（ページ編集+ユーザー管理）, 'user'=利用者（ページ編集のみ）。 */
export type Role = 'admin' | 'user';

/** 現在のユーザーが管理者か。 */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * 管理者必須の処理で呼ぶ。未ログイン or 管理者でなければ例外を投げる。
 * ユーザー管理などの管理者専用 Server Action 冒頭で必ず呼ぶこと。
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN: 管理者権限が必要です。');
  }
  return user;
}
