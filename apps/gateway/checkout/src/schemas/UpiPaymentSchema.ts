import { z } from "zod";

export const upiPaymentSchema = z.object({
  upiId: z
    .string()
    .min(1, "UPI ID is required")
    .regex(
      /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/,
      "Enter a valid UPI ID (e.g., name@upi)",
    ),
});

export type UpiPaymentFormData = z.infer<typeof upiPaymentSchema>;
export default upiPaymentSchema;
