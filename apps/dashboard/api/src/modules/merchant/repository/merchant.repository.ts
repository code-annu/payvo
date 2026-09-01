import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import MerchantMapper from "../merchant.mapper.js";
import { Merchant } from "../entity/merchant.entity.js";
import { db, MerchantCreateInput } from "@payvo/database";
import { UserMerchants } from "../entity/user-merchants.entity.js";

@injectable()
export default class MerchantRepository {
  constructor(
    @inject(TYPES.MerchantMapper) private readonly mapper: MerchantMapper,
  ) {}

  async createMerchants(data: MerchantCreateInput): Promise<Merchant> {
    const merchant = await db.orm.public.Merchant.create(data);
    return this.mapper.toMerchantEntity(merchant);
  }

  async findMerchantById(id: string): Promise<Merchant | null> {
    const merchant = await db.orm.public.Merchant.first({ id });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async findMerchantsByUserId(userId: string): Promise<UserMerchants> {
    const merchants = await db.orm.public.Merchant.where({ userId }).all();
    return this.mapper.toUserMerchantsEntity(userId, merchants);
  }

  async deleteMerchant(id: string): Promise<void> {
    await db.orm.public.Merchant.where({ id }).delete();
  }

  async inactivateMerchant(id: string): Promise<Merchant | null> {
    const merchant = await db.orm.public.Merchant.where({ id }).update({
      isActive: false,
    });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }

  async activateMerchant(id: string): Promise<Merchant | null> {
    const merchant = await db.orm.public.Merchant.where({ id }).update({
      isActive: true,
    });
    return merchant ? this.mapper.toMerchantEntity(merchant) : null;
  }
}
