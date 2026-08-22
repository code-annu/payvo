import { prisma } from "@/core/prisma/prisma.client";
import { injectable } from "inversify";
import { ApiKey } from "../entity/api-key.entity";
import { Prisma } from "@/generated/prisma";

@injectable()
export default class ApiKeyRepository {
  private readonly db = prisma;

  async create(data: Prisma.ApiKeyUncheckedCreateInput): Promise<ApiKey> {
    return this.db.apiKey.create({ data });
  }

  async findById(id: string): Promise<ApiKey | null> {
    return this.db.apiKey.findUnique({ where: { id } });
  }

  async findByMerchantId(merchantId: string): Promise<ApiKey[]> {
    return this.db.apiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(id: string): Promise<ApiKey> {
    return this.db.apiKey.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<ApiKey> {
    return this.db.apiKey.delete({ where: { id } });
  }
}
