import z from "zod";

export const CreateCheckoutSessionSchema = {
  body: z.object({
    merchantCustomerId: z
      .uuid("Merchant customer ID must be a valid UUID")
      .trim()
      .nonempty("Merchant customer ID cannot be empty"),
    merchantOrderId: z
      .uuid("Merchant order ID must be a valid UUID")
      .trim()
      .nonempty("Merchant order ID cannot be empty"),
    idempotencyKey: z
      .string("Idempotency key must be a string")
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
