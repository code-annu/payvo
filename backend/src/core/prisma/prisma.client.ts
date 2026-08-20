import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import ENV from "../config/env";

const pool = new pg.Pool({ connectionString: ENV.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// export type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
export { prisma };
export type Tx = Prisma.TransactionClient;
