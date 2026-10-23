import { prisma } from "@payvo/database/client";
import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  type ApiKey,
  type ApiKeyUncheckedCreateInput,
} from "@payvo/database/types";
import { randomUUID } from "node:crypto";

export default abstract class ApiKeyFactory {
  static async create(
    merchantId: string,
    data: Partial<Omit<ApiKeyUncheckedCreateInput, "merchantId">> = {},
  ): Promise<ApiKey> {
    return prisma.apiKey.create({
      data: {
        merchantId,
        keyId: `pvo_test_${randomUUID()}`,
        secretHash: "test-secret-hash",
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
        ...data,
      },
    });
  }

  static async find(id: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { id } });
  }

  static async findByMerchantId(merchantId: string): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: "asc" },
    });
  }
}
