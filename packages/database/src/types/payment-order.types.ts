import { db } from "../prisma/db.js";

export type PaymentOrder = Awaited<
  ReturnType<typeof db.orm.public.PaymentOrder.create>
>;

export type PaymentOrderCreateInput = Parameters<
  typeof db.orm.public.PaymentOrder.create
>[0];
