import { db } from "../prisma/db.js";

export type Merchant = Awaited<
  ReturnType<typeof db.orm.public.Merchant.create>
>;

export type MerchantCreateInput = Parameters<
  typeof db.orm.public.Merchant.create
>[0];

type MerchantWhereChain = ReturnType<typeof db.orm.public.Merchant.where>;
export type MerchantUpdateInput = Parameters<MerchantWhereChain["update"]>[0];

async function temp() {
  const result = await db.orm.public.Merchant.where({ id: "" })
    .include("user", (user) => user.select("id", "email"))
    .first();
}
