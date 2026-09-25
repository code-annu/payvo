import { db } from "../prisma/db.js";

export type PaymentAttempt = Awaited<
  ReturnType<typeof db.orm.public.PaymentAttempt.create>
>;

export type PaymentAttemptCreateInput = Parameters<
  typeof db.orm.public.PaymentAttempt.create
>[0];
