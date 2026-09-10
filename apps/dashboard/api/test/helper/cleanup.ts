import { client } from "@payvo/database/client";

export default async function resetDb() {
  await client.orm.public.RefreshToken.where({}).deleteAll();
  await client.orm.public.Session.where({}).deleteAll();
  await client.orm.public.User.where({}).deleteAll();
}
