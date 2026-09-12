import { client } from "@payvo/database/client";
import type { ApiKey } from "@payvo/database/types";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";

export interface ApiKeyOverrides {
  merchantId: string;
  environment?: "TEST" | "LIVE";
  status?: "ACTIVE" | "REVOKED" | "GRACE_PERIOD";
}

export abstract class ApiKeyFactory {
  static async createApiKey(
    overrides: ApiKeyOverrides,
  ): Promise<{ apiKey: ApiKey; plainKeySecret: string }> {
    const environment = overrides.environment ?? "TEST";
    const { keyId, keySecret } = generateApiKey(environment);
    const secretHash = hashKeySecret(keySecret);

    const apiKey = await client.orm.public.ApiKey.create({
      merchantId: overrides.merchantId,
      keyId,
      secretHash,
      environment,
    });

    // Handle status override if not default ACTIVE
    if (overrides.status && overrides.status !== "ACTIVE") {
      const updated = await client.orm.public.ApiKey.where({
        id: apiKey.id,
      }).update({
        status: overrides.status,
        ...(overrides.status === "REVOKED"
          ? { revokedAt: new Date().toISOString() }
          : {}),
        ...(overrides.status === "GRACE_PERIOD"
          ? { graceEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
          : {}),
      });
      if (!updated) throw new Error("Failed to update api key status");
      return { apiKey: updated, plainKeySecret: keySecret };
    }

    return { apiKey, plainKeySecret: keySecret };
  }

  static async findApiKeyById(id: string): Promise<ApiKey | null> {
    return client.orm.public.ApiKey.first({ id });
  }

  static async findApiKeysByMerchantId(merchantId: string): Promise<ApiKey[]> {
    return client.orm.public.ApiKey.where({ merchantId }).all();
  }

  static async findActiveKey(
    merchantId: string,
    environment: "TEST" | "LIVE",
  ): Promise<ApiKey | null> {
    return client.orm.public.ApiKey.first({
      merchantId,
      environment,
      status: "ACTIVE",
    });
  }
}
