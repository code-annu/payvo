import { db } from "../prisma/db.js";

export type PaymentMethod = Awaited<
  ReturnType<typeof db.orm.public.PaymentMethod.create>
>;

export type PaymentMethodCreateInput = Parameters<
  typeof db.orm.public.PaymentMethod.create
>[0];
