import { client } from "@payvo/database/client";
import { MerchantCreateInput } from "@payvo/database/types";
import { injectable } from "inversify";
import { Merchant } from "../entity/merchant.entity.js";
import { UserMerchants } from "../entity/user-merchants.entity.js";
import { stringToDate } from "@/core/utils/date.utils.js";

@injectable()
export default class MerchantRepository {
  private readonly db = client;

  async create(data: MerchantCreateInput): Promise<Merchant> {
    const merchant = await this.db.orm.public.Merchant.create(data);
    return {
      ...merchant,
      createdAt: stringToDate(merchant.createdAt),
      updatedAt: stringToDate(merchant.updatedAt),
    };
  }

  async findById(id: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({ id });
    return merchant
      ? {
          ...merchant,
          createdAt: stringToDate(merchant.createdAt),
          updatedAt: stringToDate(merchant.updatedAt),
        }
      : null;
  }

  async findByMid(mid: string): Promise<Merchant | null> {
    const merchant = await this.db.orm.public.Merchant.first({ mid });
    return merchant
      ? {
          ...merchant,
          createdAt: stringToDate(merchant.createdAt),
          updatedAt: stringToDate(merchant.updatedAt),
        }
      : null;
  }

  async findByUserId(userId: string): Promise<UserMerchants> {
    const merchants = await this.db.orm.public.Merchant.where({ userId }).all();
    return {
      userId,
      merchants: merchants.map((m) => ({
        id: m.id,
        mid: m.mid,
        isActive: m.isActive,
      })),
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.orm.public.Merchant.where({ id }).delete();
  }
}
