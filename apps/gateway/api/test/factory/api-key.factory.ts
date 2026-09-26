import { client } from "@payvo/database/client";
import type { ApiKey, ApiKeyCreateInput } from "@payvo/database/types";
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";

interface ApiKeyCredentials {
  apiKey: ApiKey;
  keyId: string;
  keySecret: string;
}

export default abstract class ApiKeyFactory {
  private static db = client;

  static async createApiKey(
    merchantId: string,
    overrides: Partial<ApiKeyCreateInput> = {},
  ): Promise<ApiKeyCredentials> {
    const credentials = generateApiKey("TEST");
    const apiKey = await this.db.orm.public.ApiKey.create({
      merchantId,
      keyId: credentials.keyId,
      secretHash: hashKeySecret(credentials.keySecret),
      environment: "TEST",
      ...overrides,
    });

    return { apiKey, ...credentials };
  }
}
