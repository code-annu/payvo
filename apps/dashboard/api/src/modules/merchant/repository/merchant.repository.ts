import { inject, injectable } from "inversify";
import MerchantMapper from "../merchant.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client } from "@payvo/database/client";
import { MerchantCreateInput } from "@payvo/database/types";
import { Merchant } from "../entity/merchant.entity.js";
import { UserMerchants } from "../entity/user-merchants.entity.js";

@injectable()
export default class MerchantRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.MerchantMapper)
    private readonly mapper: MerchantMapper,
  ) {}

  async create(data: MerchantCreateInput): Promise<Merchant> {
    const merchant = await this.db.orm.public.Merchant.create(data);
    return this.mapper.toMerchantEntity(merchant);
  }

  async findOwnedByUser(data: {
    merchantId: string;
    userId: string;
  }): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({
      id: data.merchantId,
      userId: data.userId,
    });

    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async findByUser(userId: string): Promise<UserMerchants> {
    const merchants = await this.db.orm.public.Merchant.where({
      userId,
    }).all();

    return this.mapper.toUserMerchantsEntity(userId, merchants);
  }

  async findById(id: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({ id });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async delete(data: {
    merchantId: string;
    userId: string;
  }): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.where({
      id: data.merchantId,
      userId: data.userId,
    }).delete();

    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }
}
