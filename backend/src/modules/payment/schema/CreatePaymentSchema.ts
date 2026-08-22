import z from "zod";

export const CreatePaymentSchema = {
  body: z.object({
    customerId: z
      .uuid("Valid customer id is required")
      .trim()
      .nonempty("Order id cannot be empty"),
    orderId: z
      .uuid("Valid order id is required")
      .trim()
      .nonempty("Order id cannot be empty"),
    idempotencyKey: z
      .string("Idempotency key is required")
      .trim()
      .nonempty("Idempotency key cannot be empty"),
    amount: z.number("Amount is required").positive("Amount must be positive"),
    currency: z
      .string("Currency is required")
      .length(3, "Currency must be 3 characters")
      .toUpperCase(),
    description: z.string().trim().nullish(),
  }),
};
