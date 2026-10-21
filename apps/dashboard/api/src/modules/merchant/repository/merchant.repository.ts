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

  closeMerchant(
    tx: TransactionClient,
    data: { merchantId: string; closedAt: Date },
  ): Promise<Merchant> {
    return tx.merchant.update({
      where: { id: data.merchantId, status: "ACTIVE" },
      data: { status: "CLOSED", closedAt: data.closedAt },
    });
  }

  async closeByUserId(
    tx: TransactionClient,
    data: { userId: string; closedAt: Date },
  ) {
    await tx.merchant.updateMany({
      where: { userId: data.userId },
      data: { status: "CLOSED", closedAt: data.closedAt },
    });
  }
}
