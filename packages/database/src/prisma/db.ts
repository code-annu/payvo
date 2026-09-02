import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.js";
import contractJson from "./contract.json" with { type: "json" };
import { databaseConfig } from "@payvo/config/database";

export const db = postgres<Contract>({
  contractJson,
  url: databaseConfig.url,
});


export type TransactionClient = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];


