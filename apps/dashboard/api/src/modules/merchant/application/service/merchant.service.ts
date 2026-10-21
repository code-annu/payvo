import { dbTransaction } from "@payvo/database/client";
import { generateAlphaNumericId } from "@payvo/shared/crypto";
import { inject, injectable } from "inversify";
import * as merchantErrors from "../../error/merchant.errors.js";
import MerchantRepository from "../../repository/merchant.repository.js";
import { MerchantTypes } from "../../merchant.types.js";
import { ApiKeyTypes } from "@/modules/api-key/api-key.types.js";
import type { ApiKeyContract } from "@/modules/api-key/contract/api-key.contract.js";

@injectable()
export default class MerchantService {
  constructor(
    @inject(MerchantTypes.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
    @inject(ApiKeyTypes.ApiKeyContract)
    private readonly apiKeyContract: ApiKeyContract,
  ) {}

  async createMerchant(userId: string) {
    const merchant = await dbTransaction((tx) =>
      this.merchantRepo.create(tx, {
        userId,
        mid: generateAlphaNumericId(),
        status: "ACTIVE",
      }),
    );

    return merchant;
  }

  async getAllMerchants(userId: string) {
    const merchants = await this.merchantRepo.findAllByUserId(userId);
    return { userId, merchants };
  }

  async getMerchantDetails(merchantId: string, userId: string) {
    const merchant = await this.merchantRepo.findMerchantOwnedByUser(
      userId,
      merchantId,
    );
    if (!merchant) {
      throw new merchantErrors.MerchantNotFoundError();
    }

    return merchant;
  }

  async closeMerchant(merchantId: string, userId: string) {
    return dbTransaction(async (tx) => {
      const now = new Date();
      const merchant = await this.merchantRepo.findMerchantOwnedByUser(
        userId,
        merchantId,
        tx,
      );
      if (!merchant) {
        throw new merchantErrors.MerchantNotFoundError();
      }
      if (merchant.status !== "ACTIVE") {
        throw new merchantErrors.MerchantNotActiveError(
          "Merchant is already closed",
        );
      }

      await this.apiKeyContract.revokeMerchantApiKeys(tx, {
        merchantId,
        revokedAt: now,
      });

      const updatedMerchant = await this.merchantRepo.closeMerchant(tx, {
        merchantId,
        closedAt: now,
      });

      return updatedMerchant;
    });
  }

}
