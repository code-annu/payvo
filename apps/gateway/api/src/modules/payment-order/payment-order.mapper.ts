import type { PaymentOrder as PrismaPaymentOrder } from "@payvo/database/types";
import { injectable } from "inversify";
import type { PaymentOrder } from "./entity/payment-order.entity.js";

@injectable()
export default class PaymentOrderMapper {
  toPaymentOrderEntity(paymentOrder: PrismaPaymentOrder): PaymentOrder {
    return {
      id: paymentOrder.id,
      merchantId: paymentOrder.merchantId,
      merchantCustomerId: paymentOrder.merchantCustomerId,
      merchantOrderId: paymentOrder.merchantOrderId,
      idempotencyKey: paymentOrder.idempotencyKey,
      csi: paymentOrder.csi,
      amount: String(paymentOrder.amount),
      currency: paymentOrder.currency,
      status: paymentOrder.status,
      completedAt: paymentOrder.completedAt
        ? new Date(paymentOrder.completedAt)
        : null,
      expiresAt: new Date(paymentOrder.expiresAt),
      createdAt: new Date(paymentOrder.createdAt),
      updatedAt: new Date(paymentOrder.updatedAt),
    };
  }
}
