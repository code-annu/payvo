import { db } from "../prisma/db.js";

export type ApiKey = Awaited<ReturnType<typeof db.orm.public.ApiKey.create>>;

export type ApiKeyCreateInput = Parameters<
  typeof db.orm.public.ApiKey.create
>[0];

type ApiKeyWhereChain = ReturnType<typeof db.orm.public.ApiKey.where>;
export type ApiKeyUpdateInput = Parameters<ApiKeyWhereChain["update"]>[0];
