import z from "zod";
import { MerchantIdSchema } from "../fields/merchant.fields.js";

const MerchantParamsSchema = z.object({
  merchantId: MerchantIdSchema.nonempty("Merchant id cannot be empty"),
});

export const GetMerchantDetailsSchema = {
  params: MerchantParamsSchema,
};

export const CloseMerchantSchema = {
  params: MerchantParamsSchema,
};
