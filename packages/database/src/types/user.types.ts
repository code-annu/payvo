import { db } from "../prisma/db";

export type User = Awaited<ReturnType<typeof db.orm.public.User.create>>;

export type UserCreateInput = Parameters<typeof db.orm.public.User.create>[0];

// In Prisma 8, `.update()` is chained after `.where()`, so we derive
// the data parameter from a where-scoped collection, not the root model.
type UserWhereChain = ReturnType<typeof db.orm.public.User.where>;
export type UserUpdateInput = Parameters<UserWhereChain["update"]>[0];
