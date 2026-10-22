import type { TransactionClient } from "@payvo/database/client";
import { inject, injectable } from "inversify";
import { ApiKeyTypes } from "../api-key.types.js";
import ApiKeyRepository from "../repository/api-key.repository.js";

@injectable()
export class ApiKeyContract {
  constructor(
    @inject(ApiKeyTypes.ApiKeyRepository)
    private readonly apiKeyRepo: ApiKeyRepository,
  ) {}

  async revokeUserApiKeys(
    tx: TransactionClient,
    data: { userId: string; revokedAt: Date },
  ): Promise<void> {
    await this.apiKeyRepo.revokeAllByUserId(tx, data);
  }

  async revokeMerchantApiKeys(
    tx: TransactionClient,
    data: { merchantId: string; revokedAt: Date },
  ): Promise<void> {
    await this.apiKeyRepo.revokeMerchant(tx, data);
  }
}
