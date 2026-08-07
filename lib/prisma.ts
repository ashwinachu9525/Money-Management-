import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we are running in an environment with DATABASE_URL
// If not, we just provide an empty string to avoid crashes during Next.js build
const connectionString = process.env.DATABASE_URL || "";

// We only initialize the adapter if connectionString is present.
// Next.js build step sometimes runs files without loading .env completely.
let adapter;
if (connectionString) {
  // pg driver's connection string parser might overwrite the ssl object if sslmode=require is in the string.
  const cleanConnectionString = connectionString.replace('?sslmode=require', '');
  const pool = new Pool({ 
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
  });
  adapter = new PrismaPg(pool);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter || undefined,
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
