import { db } from "../prisma/db.js";

export type Merchant = Awaited<
  ReturnType<typeof db.orm.public.Merchant.create>
>;

export type MerchantCreateInput = Pick<Merchant, "userId">;
