import { client } from "@payvo/database/client";
import { MerchantCreateInput } from "@payvo/database/types";
import { inject, injectable } from "inversify";
import { Merchant } from "../entity/merchant.entity.js";
import { UserMerchants } from "../entity/user-merchants.entity.js";
import TYPES from "@/core/di/inversify.types.js";
import MerchantMapper from "../merchant.mapper.js";

@injectable()
export default class MerchantRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.MerchantMapper) private readonly mapper: MerchantMapper,
  ) {}

  async create(data: MerchantCreateInput): Promise<Merchant> {
    const merchant = await this.db.orm.public.Merchant.create(data);
    return this.mapper.toMerchantEntity(merchant);
  }

  async findUserMerchant(data: {
    merchantId: string;
    userId: string;
  }): Promise<Merchant | null> {
    const { userId, merchantId } = data;
    const merchant = await this.db.orm.public.Merchant.first({
      id: merchantId,
      userId,
    });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async findById(id: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({
      id,
    });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async checkMidExists(mid: string): Promise<boolean> {
    const merchant = await this.db.orm.public.Merchant.first({
      mid,
    });
    return Boolean(merchant);
  }

  async findByMid(mid: string, userId: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({
      mid,
      userId,
    });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async findByUserId(userId: string): Promise<UserMerchants> {
    const merchants = await this.db.orm.public.Merchant.where({ userId }).all();
    return this.mapper.toUserMerchantsEntity(userId, merchants);
  }

  async delete(data: {
    merchantId: string;
    userId: string;
  }): Promise<Merchant | null> {
    const { userId, merchantId } = data;
    const merchant = await this.db.orm.public.Merchant.where({
      id: merchantId,
      userId,
    }).delete();

    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }
}
