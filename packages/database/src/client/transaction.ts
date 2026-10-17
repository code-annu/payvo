import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./prisma.client.js";

export type TransactionClient = Prisma.TransactionClient;

export async function transaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(callback);
}
