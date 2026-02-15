/**
 * Shared Prisma client instance.
 *
 * Centralised to avoid multiple connections and to simplify imports.
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
