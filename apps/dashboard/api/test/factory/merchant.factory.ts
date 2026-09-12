import { client } from "@payvo/database/client";
import type { Merchant } from "@payvo/database/types";
import { generateAlphaNumericId } from "@payvo/shared/crypto";

export interface MerchantOverrides {
  userId?: string;
  mid?: string;
  isActive?: boolean;
}

let merchantCounter = 0;

export abstract class MerchantFactory {
  static async createMerchant(
    overrides: MerchantOverrides = {},
  ): Promise<Merchant> {
    merchantCounter++;
    const mid = overrides.mid ?? generateAlphaNumericId(10);
    const merchant = await client.orm.public.Merchant.create({
      userId: overrides.userId!,
      mid,
      isActive: overrides.isActive ?? true,
    });
    return merchant;
  }

  static async findMerchantById(id: string): Promise<Merchant | null> {
    return client.orm.public.Merchant.first({ id });
  }

  static async findMerchantByMid(mid: string): Promise<Merchant | null> {
    return client.orm.public.Merchant.first({ mid });
  }

  static async findMerchantsByUserId(userId: string): Promise<Merchant[]> {
    return client.orm.public.Merchant.where({ userId }).all();
  }
}
