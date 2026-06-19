/**
 * ルート保護ミドルウェア（① セキュリティ）
 *
 * /admin 以下へのアクセス時にセッションCookie（JWT）を検証し、
 * 未ログインなら /login へリダイレクトする（?from= で元URLを保持）。
 *
 * Edge ランタイムで動作するため、bcrypt は使わず jose の JWT 検証のみ行う。
 * Server Action 側でも requireUser() で二重に保護する（多層防御）。
 */
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'seihu_session';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? '';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let authed = false;
  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      authed = true;
    } catch {
      authed = false;
    }
  }

  if (!authed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // /admin 以下のみ保護（静的アセット等は対象外）。
  matcher: ['/admin/:path*'],
};
