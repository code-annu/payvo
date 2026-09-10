import { db } from "../prisma/db";

export type Session = Awaited<ReturnType<typeof db.orm.public.Session.create>>;

export type SessionCreateInput = Parameters<
  typeof db.orm.public.Session.create
>[0];

type SessionWhereChain = ReturnType<typeof db.orm.public.Session.where>;
export type SessionUpdateInput = Parameters<SessionWhereChain["update"]>[0];
