import { prisma } from "@payvo/database/client";
import {
  MerchantStatus,
  type Merchant,
  type MerchantUncheckedCreateInput,
} from "@payvo/database/types";
import { generateAlphaNumericId } from "@payvo/shared/crypto";

export default abstract class MerchantFactory {
  static async create(
    userId: string,
    data: Partial<Omit<MerchantUncheckedCreateInput, "userId">> = {},
  ): Promise<Merchant> {
    return prisma.merchant.create({
      data: {
        userId,
        mid: generateAlphaNumericId(),
        status: MerchantStatus.ACTIVE,
        ...data,
      },
    });
  }

  static async find(merchantId: string): Promise<Merchant | null> {
    return prisma.merchant.findUnique({ where: { id: merchantId } });
  }

  static async findByUserId(userId: string): Promise<Merchant[]> {
    return prisma.merchant.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }
}
