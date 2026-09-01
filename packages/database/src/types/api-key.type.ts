import { db } from "../prisma/db.js";

export type ApiKey = Awaited<ReturnType<typeof db.orm.public.ApiKey.create>>;

export type ApiKeyCreateInput = Pick<ApiKey, "merchantId" | "environment">;
