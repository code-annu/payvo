import { prisma, TransactionClient } from "@payvo/database/client";
import type {
  ApiKey,
  ApiKeyEnvironment,
  ApiKeyUncheckedCreateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class ApiKeyRepository {
  private readonly db = prisma;

  findActiveKey(input: {
    merchantId: string;
    environment: ApiKeyEnvironment;
  }): Promise<ApiKey | null> {
    return this.db.apiKey.findFirst({
      where: {
        merchantId: input.merchantId,
        environment: input.environment,
        status: "ACTIVE",
      },
    });
  }

  findByMerchantId(merchantId: string): Promise<ApiKey[]> {
    return this.db.apiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
  }

  findByMerchantAndKeyId(input: {
    merchantId: string;
    keyId: string;
  }): Promise<ApiKey | null> {
    return this.db.apiKey.findFirst({
      where: {
        merchantId: input.merchantId,
        keyId: input.keyId,
      },
    });
  }

  create(
    data: ApiKeyUncheckedCreateInput,
    tx?: TransactionClient,
  ): Promise<ApiKey> {
    return (tx || this.db).apiKey.create({ data });
  }

  async revokeKey(input: {
    id: string;
    revokedAt: Date;
  }): Promise<ApiKey | null> {
    const result = await this.db.apiKey.updateMany({
      where: { id: input.id, status: { not: "REVOKED" } },
      data: {
        status: "REVOKED",
        graceEndsAt: null,
        revokedAt: input.revokedAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.db.apiKey.findUnique({ where: { id: input.id } });
  }

  async revokeKeyForRotation(
    tx: TransactionClient,
    data: {
      id: string;
      revokeNow: boolean;
      graceEndsAt: Date | null;
      revokedAt: Date | null;
    },
  ) {
    const { id, revokeNow, graceEndsAt, revokedAt } = data;
    return await tx.apiKey.update({
      where: { id: id },
      data: {
        status: revokeNow ? "REVOKED" : "GRACE_PERIOD",
        graceEndsAt,
        revokedAt,
      },
    });
  }
}
