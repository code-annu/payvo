import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConfig } from "@payvo/config/database";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new pg.Pool({ connectionString: databaseConfig.url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
