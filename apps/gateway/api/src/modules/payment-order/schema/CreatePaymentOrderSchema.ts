import z from "zod";

export const CreatePaymentOrderSchema = {
  body: z.object({
    merchantCustomerId: z
      .uuid("Merchant customer id must be a valid uuid")
      .trim()
      .nonempty("Merchant order id cannot be empty"),
    merchantOrderId: z
      .uuid("Merchant order id must be a valid uuid")
      .trim()
      .nonempty("Merchant order id cannot be empty"),
    idempotencyKey: z
      .string("Idempotency key is required")
      .trim()
      .nonempty("Idempotency key cannot be empty"),
    amount: z.number().positive("Amount must be a positive number"),
    currency: z
      .string("Currency must be a string")
      .length(3, "Currency must be 3 characters long")
      .trim()
      .nonempty("Currency cannot be empty")
      .uppercase(),
  }),
};
