import z from "zod";

const MerchantIdSchema = z.object({
  id: z.uuid("Invalid merchant ID"),
});

export const MerchantIdParamsSchema = {
  params: MerchantIdSchema,
};
