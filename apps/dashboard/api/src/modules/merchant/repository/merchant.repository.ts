import { prisma, type TransactionClient } from "@payvo/database/client";
import type {
  Merchant,
  MerchantUncheckedCreateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class MerchantRepository {
  private readonly db = prisma;

  findAllByUserId(userId: string): Promise<Merchant[]> {
    return this.db.merchant.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  findMerchantOwnedByUser(
    userId: string,
    merchantId: string,
    tx?: TransactionClient,
  ): Promise<Merchant | null> {
    return (tx ?? this.db).merchant.findUnique({
      where: { id: merchantId, userId },
    });
  }

  create(
    tx: TransactionClient,
    data: MerchantUncheckedCreateInput,
  ): Promise<Merchant> {
    return tx.merchant.create({ data });
  }

  closeMerchant(tx: TransactionClient, merchantId: string): Promise<Merchant> {
    return tx.merchant.update({
      where: { id: merchantId, status: "ACTIVE" },
      data: { status: "CLOSED", closedAt: new Date() },
    });
  }
}
