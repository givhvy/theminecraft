// Prisma client singleton — SQLite local, đổi sang Prisma Postgres bằng cách đổi DATABASE_URL + provider
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function initDb(): Promise<void> {
  await prisma.$connect();
}
