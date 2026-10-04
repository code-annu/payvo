import { z } from "zod";

export const netBankingSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank"),
});

export type NetBankingFormData = z.infer<typeof netBankingSchema>;
export default netBankingSchema;
