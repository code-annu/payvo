import {
  ApiKeyEnvironmentSchema,
  MerchantIdSchema,
} from "@payvo/shared/schema";
import z from "zod";

const MerchantParamsSchema = z.object({
  merchantId: MerchantIdSchema.nonempty("Merchant id cannot be empty"),
});

export const GenerateApiKeySchema = {
  params: MerchantParamsSchema,
  body: z.object({
    environment: ApiKeyEnvironmentSchema,
  }),
};

export const GetActiveApiKeySchema = {
  params: MerchantParamsSchema,
  query: z.object({
    environment: ApiKeyEnvironmentSchema,
  }),
};
