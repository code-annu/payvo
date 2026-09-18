import z from "zod";
import { MerchantIdSchema } from "../../schema/MerchantIdSchema.js";

export type GetMerchantDto = z.infer<typeof MerchantIdSchema> & {
  userId: string;
};
