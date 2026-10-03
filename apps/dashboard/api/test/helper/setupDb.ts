import { client } from "@payvo/database/client";

export async function setupDb() {
  await cleanupDb();
}

async function cleanupDb() {
  await client.orm.public.Transaction.where({}).deleteAll();
  await client.orm.public.PaymentAttempt.where({}).deleteAll();
  await client.orm.public.PaymentMethod.where({}).deleteAll();
  await client.orm.public.PaymentOrder.where({}).deleteAll();
  await client.orm.public.ApiKey.where({}).deleteAll();
  await client.orm.public.Merchant.where({}).deleteAll();
  await client.orm.public.RefreshToken.where({}).deleteAll();
  await client.orm.public.Session.where({}).deleteAll();
  await client.orm.public.User.where({}).deleteAll();
  await client.orm.public.Webhook.where({}).deleteAll();
}
