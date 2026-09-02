import { db } from "@payvo/database";

export default async function cleanup() {
  await db.orm.public.ApiKey.where({}).deleteAll();
  await db.orm.public.Merchant.where({}).deleteAll();
  await db.orm.public.Session.where({}).deleteAll();
  await db.orm.public.User.where({}).deleteAll();
}
