import { dbTransaction } from "@payvo/database/client";
import { generateAlphaNumericId } from "@payvo/shared/crypto";
import { inject, injectable } from "inversify";
import * as merchantErrors from "../../error/merchant.errors.js";
import MerchantMapper from "../../mapper/merchant.mapper.js";
import MerchantRepository from "../../repository/merchant.repository.js";
import { MerchantTypes } from "../../merchant.types.js";
import type {
  MerchantOutputDto,
  UserMerchantsDto,
} from "../dto/merchant.dto.js";
import { MerchantContract } from "../../contract/merchant.contract.js";

@injectable()
export default class MerchantService implements MerchantContract {
  constructor(
    @inject(MerchantTypes.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
    @inject(MerchantTypes.MerchantMapper)
    private readonly merchantMapper: MerchantMapper,
  ) {}

  async createMerchant(userId: string): Promise<MerchantOutputDto> {
    const merchant = await dbTransaction((tx) =>
      this.merchantRepo.create(tx, {
        userId,
        mid: generateAlphaNumericId(),
        status: "ACTIVE",
      }),
    );

    return this.merchantMapper.mapToMerchantOutput(merchant);
  }

  async getAllMerchants(userId: string): Promise<UserMerchantsDto> {
    const merchants = await this.merchantRepo.findAllByUserId(userId);
    return this.merchantMapper.mapToUserMerchantsOutput(userId, merchants);
  }

  async getMerchantDetails(
    merchantId: string,
    userId: string,
  ): Promise<MerchantOutputDto> {
    const merchant = await this.merchantRepo.findMerchantOwnedByUser(
      userId,
      merchantId,
    );
    if (!merchant) {
      throw new merchantErrors.MerchantNotFoundError();
    }

    return this.merchantMapper.mapToMerchantOutput(merchant);
  }

  async closeMerchant(
    merchantId: string,
    userId: string,
  ): Promise<MerchantOutputDto> {
    return dbTransaction(async (tx) => {
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

      const updatedMerchant = await this.merchantRepo.closeMerchant(
        tx,
        merchantId,
      );

      return this.merchantMapper.mapToMerchantOutput(updatedMerchant);
    });
  }

  async getActiveMerchantOwnedByUser(userId: string, merchantId: string) {
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
}
