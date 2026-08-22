import { prisma } from "@/core/prisma/prisma.client";
import { injectable } from "inversify";
import { Merchant } from "@/modules/payment/merchant/entity/merchant.entity";
import { Prisma } from "@/generated/prisma";

@injectable()
export default class MerchantRepository {
  private readonly db = prisma;

  async create(data: Prisma.MerchantUncheckedCreateInput): Promise<Merchant> {
    return this.db.merchant.create({ data });
  }

  async findById(id: string): Promise<Merchant | null> {
    return this.db.merchant.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<Merchant> {
    return this.db.merchant.delete({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Merchant[]> {
    return this.db.merchant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
