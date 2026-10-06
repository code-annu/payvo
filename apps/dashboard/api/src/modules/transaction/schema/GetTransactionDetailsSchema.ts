import { MerchantIdSchema } from "@/modules/merchant/schema/MerchantIdSchema.js";
import { TransactionIdSchema } from "./TransactionIdSchema.js";

export const GetTransactionDetailsSchema = {
  params: MerchantIdSchema.extend({ ...TransactionIdSchema.shape }),
};
