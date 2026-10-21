import type { TransactionClient } from "@payvo/database/client";
import type { Merchant } from "@payvo/database/types";
import { inject, injectable } from "inversify";
import * as merchantErrors from "../error/merchant.errors.js";
import { MerchantTypes } from "../merchant.types.js";
import MerchantRepository from "../repository/merchant.repository.js";

@injectable()
export class MerchantContract {
  constructor(
    @inject(MerchantTypes.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async getActiveMerchantOwnedByUser(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findMerchantOwnedByUser(
      userId,
      merchantId,
    );
    if (!merchant) {
      throw new merchantErrors.MerchantNotFoundError();
    }
    if (merchant.status !== "ACTIVE") {
      throw new merchantErrors.MerchantNotActiveError();
    }

    return merchant;
  }

  async getMerchantOwnedByUser(
    userId: string,
    merchantId: string,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepo.findMerchantOwnedByUser(
      userId,
      merchantId,
    );
    if (!merchant) {
      throw new merchantErrors.MerchantNotFoundError();
    }
    return merchant;
  }

  async closeUserMerchants(
    tx: TransactionClient,
    data: { userId: string; closedAt: Date },
  ): Promise<void> {
    await this.merchantRepo.closeByUserId(tx, data);
  }
}
