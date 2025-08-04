import { PrismaClient } from '@prisma/client';

/**
 * グローバルPrismaクライアントインスタンス用の型定義
 * @private
 */
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

/**
 * Prismaクライアントのシングルトンインスタンス
 *
 * @description
 * 開発環境ではホットリロード時に複数のPrismaClientインスタンスが
 * 作成されるのを防ぐため、グローバル変数に保存します。
 * 本番環境では通常のインスタンスとして動作します。
 *
 * @example
 * import { prisma } from '$lib/server/prisma';
 *
 * const users = await prisma.user.findMany();
 *
 * @see {@link https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices}
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
