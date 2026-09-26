import z from "zod";
import { CreatePaymentOrderSchema } from "../../schema/CreatePaymentOrderSchema.js";

export type CreatePaymentOrderInputDto = z.infer<
  typeof CreatePaymentOrderSchema.body
> & { merchantId: string };

export interface CreatePaymentOrderOutputDto {
  checkoutUrl: string;
}
