import { prisma } from "@/core/prisma/prisma.client";
import crypto from "crypto";

export default abstract class MerchantFactory {
  static async createMerchant(
    userId: string,
    isActive: boolean = true,
  ) {
    const merchant = await prisma.merchant.create({
      data: {
        userId,
        isActive,
      },
    });
    return merchant;
  }

  static async createApiKey(
    merchantId: string,
    overrides: {
      keyType?: "SECRET" | "PUBLISHABLE";
      environment?: "TEST" | "LIVE";
      keyPrefix?: string;
      keyHash?: string;
      isActive?: boolean;
      lastUsedAt?: Date | null;
      revokedAt?: Date | null;
    } = {},
  ) {
    const apiKey = await prisma.apiKey.create({
      data: {
        merchantId,
        keyType: overrides.keyType ?? "SECRET",
        environment: overrides.environment ?? "TEST",
        keyPrefix: overrides.keyPrefix ?? "sk_test_",
        keyHash: overrides.keyHash ?? crypto.randomBytes(32).toString("hex"),
        isActive: overrides.isActive ?? true,
        lastUsedAt: overrides.lastUsedAt ?? null,
        revokedAt: overrides.revokedAt ?? null,
      },
    });
    return apiKey;
  }
}
