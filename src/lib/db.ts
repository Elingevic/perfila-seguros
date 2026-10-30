import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// En Vercel la base actual está conectada con el prefijo V2_; si existe, tiene prioridad.
const datasourceUrl = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
