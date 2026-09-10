import { db } from "../prisma/db";

export type TransactionClient = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export async function transaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return db.transaction(callback);
}
