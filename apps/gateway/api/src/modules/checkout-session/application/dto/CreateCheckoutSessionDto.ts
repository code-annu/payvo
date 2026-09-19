import z from "zod";
import { CreateCheckoutSessionSchema } from "../../schema/CreateCheckoutSessionSchema.js";

export type CreateCheckoutSessionDto = z.infer<
  typeof CreateCheckoutSessionSchema.body
> & { merchantId: string };
