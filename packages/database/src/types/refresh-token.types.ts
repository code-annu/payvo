import { db } from "../prisma/db";

export type RefreshToken = Awaited<
  ReturnType<typeof db.orm.public.RefreshToken.create>
>;

export type RefreshTokenCreateInput = Parameters<
  typeof db.orm.public.RefreshToken.create
>[0];

type RefreshTokenWhereChain = ReturnType<typeof db.orm.public.RefreshToken.where>;
export type RefreshTokenUpdateInput = Parameters<RefreshTokenWhereChain["update"]>[0];
