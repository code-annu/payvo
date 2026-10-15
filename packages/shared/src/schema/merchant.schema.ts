import z from "zod";

export const MerchantIdSchema = z
  .uuid("Merchant id must be a valid uuid")
  .trim();
