import { db } from "../prisma/db.js";

export type Session = Awaited<ReturnType<typeof db.orm.public.Session.create>>;
export type SessionWithUser = Session & {
  user: Awaited<ReturnType<typeof db.orm.public.User.create>>;
};
export type SessionCreateInput = Pick<
  Session,
  "userId" | "tokenHash" | "expiresAt" | "userAgent" | "ipAddress"
>;

export type SessionUpdateInput = Partial<
  Pick<Session, "tokenHash" | "expiresAt">
>;
