import z from "zod";

export const AttemptPaymentSchema = {
  params: z.object({
    paymentOrderId: z
      .uuid("Payment order id must be a valid uuid")
      .trim()
      .nonempty("Payment order cannot be empty"),
  }),
  body: z.object({
    paymentMethodCode: z
      .string("Payment method code is required")
      .trim()
      .nonempty("Payment method code cannot be empty")
      .transform((pm) => pm.toUpperCase()),
  }),
};
