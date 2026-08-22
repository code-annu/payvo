import z from "zod";

const ApiKeyIdParamsSchema = z.object({
  id: z.uuid("Invalid API key ID"),
});

export const ApiKeyParamsSchema = {
  params: ApiKeyIdParamsSchema,
};

const MerchantApiKeyParamsSchema = z.object({
  id: z.uuid("Invalid merchant ID"),
});

export const MerchantApiKeyParamsSchema_ = {
  params: MerchantApiKeyParamsSchema,
};
