import { inject, injectable } from "inversify";
import { client } from "@payvo/database/client";
import type { Merchant, User } from "@payvo/database/types";
import TYPES from "@/core/di/inversify.types.js";
import ApiKeyMapper from "../api-key.mapper.js";
import type { ApiKey } from "../entity/api-key.entity.js";

@injectable()
export default class ApiKeyRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.ApiKeyMapper)
    private readonly mapper: ApiKeyMapper,
  ) {}

  async findByKeyId(keyId: string): Promise<ApiKey | null> {
    const apiKey = await this.db.orm.public.ApiKey.first({ keyId });
    return apiKey ? this.mapper.toApiKeyEntity(apiKey) : null;
  }

  async findMerchantById(merchantId: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({
      id: merchantId,
    });
    return merchant ?? null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = await this.db.orm.public.User.first({ id: userId });
    return user ?? null;
  }
}
