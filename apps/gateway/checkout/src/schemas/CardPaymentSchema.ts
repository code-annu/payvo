import { z } from "zod";

export const cardPaymentSchema = z.object({
  cardNumber: z
    .string()
    .transform((val) => val.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{16}$/, "Card number must be 16 digits")
    ),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  cardholderName: z
    .string()
    .min(2, "Cardholder name is required")
    .max(100, "Name is too long"),
});

export type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;
export default cardPaymentSchema;
