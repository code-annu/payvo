import z from "zod";

export const MerchantIdSchema = z.object({
  id: z.uuid("Valid merchant id is required"),
});
