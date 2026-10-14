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

export const ListMerchantApiKeysSchema = {
  params: MerchantParamsSchema,
};

export const RotateApiKeySchema = {
  params: MerchantParamsSchema,
  body: z.object({
    oldKeyRevokeStrategy: z.enum(["IMMEDIATELY", "24_HOURS"], {
      error: "Old key revoke strategy must be either IMMEDIATELY or 24_HOURS",
    }),
    environment: z.enum(["TEST", "LIVE"], {
      error: "Environment must be TEST or LIVE",
    }),
  }),
};
