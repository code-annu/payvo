import { db } from "../prisma/db.js";

export type Transaction = Awaited<
  ReturnType<typeof db.orm.public.Transaction.create>
>;

export type TransactionCreateInput = Parameters<
  typeof db.orm.public.Transaction.create
>[0];
