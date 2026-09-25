import z from "zod";
import { MerchantIdSchema } from "../../schema/MerchantIdSchema.js";

export type DeleteMerchant = z.infer<typeof MerchantIdSchema> & {
  userId: string;
};
