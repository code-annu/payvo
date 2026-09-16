import { client } from "@payvo/database/client";
import { connectRedis, redisClient } from "@payvo/redis";

export default async function resetDb() {
  await connectRedis();
  if (redisClient.isOpen) {
    await redisClient.flushAll();
  }
  await client.orm.public.RefreshToken.where({}).deleteAll();
  await client.orm.public.Session.where({}).deleteAll();
  await client.orm.public.ApiKey.where({}).deleteAll();
  await client.orm.public.Merchant.where({}).deleteAll();
  await client.orm.public.User.where({}).deleteAll();
}
