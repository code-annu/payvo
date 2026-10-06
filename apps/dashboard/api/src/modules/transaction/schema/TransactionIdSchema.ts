import z from "zod";

export const TransactionIdSchema = z.object({
  transactionId: z
    .uuid("Transaction id must be a valid uuid")
    .trim()
    .nonempty("Transaction id cannot be empty"),
});
