import z from "zod";

export const CheckoutPaymentOrderSchema = {
  params: z.object({
    csi: z.string("csi is required").trim().nonempty("csi cannot be empty"),
  }),
};
