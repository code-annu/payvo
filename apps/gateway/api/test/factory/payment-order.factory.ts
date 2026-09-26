import { client } from "@payvo/database/client";
import type {
  PaymentOrder,
  PaymentOrderCreateInput,
} from "@payvo/database/types";

export default abstract class PaymentOrderFactory {
  private static db = client;

  static async createPaymentOrder(
    merchantId: string,
    overrides: Partial<PaymentOrderCreateInput> = {},
  ): Promise<PaymentOrder> {
    return this.db.orm.public.PaymentOrder.create({
      merchantId,
      merchantCustomerId: crypto.randomUUID(),
      merchantOrderId: crypto.randomUUID(),
      idempotencyKey: `idempotency_${crypto.randomUUID()}`,
      csi: `csi_${crypto.randomUUID()}`,
      amount: "1000",
      currency: "USD" as PaymentOrderCreateInput["currency"],
      status: "CREATED",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      ...overrides,
    });
  }
}
