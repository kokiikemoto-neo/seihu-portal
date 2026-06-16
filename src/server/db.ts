/**
 * Prisma クライアント（① 永続化）
 *
 * dev の HMR でモジュールが再評価されても接続を再生成しないよう globalThis に退避する。
 * 本番では DATABASE_URL を Postgres 等に切り替え、prisma/schema.prisma の provider を変更する。
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  __seihuPrisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.__seihuPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__seihuPrisma = prisma;
}
