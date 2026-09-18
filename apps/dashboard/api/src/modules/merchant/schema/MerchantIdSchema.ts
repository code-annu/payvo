import z from "zod";

export const MerchantIdSchema = z.object({
  merchantId: z
    .uuid("Merchant id must be a valid uuid")
    .trim()
    .nonempty("Merchant id cannot be empty"),
});
