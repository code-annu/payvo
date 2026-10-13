import { MerchantIdSchema } from "@payvo/shared/schema";
import z from "zod";

const MerchantParamsSchema = z.object({
  merchantId: MerchantIdSchema.nonempty("Merchant id cannot be empty"),
});

export const GetMerchantDetailsSchema = {
  params: MerchantParamsSchema,
};

export const CloseMerchantSchema = {
  params: MerchantParamsSchema,
};
