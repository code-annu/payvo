import type { PaymentAttempt as PrismaPaymentAttempt } from "@payvo/database/types";
import { injectable } from "inversify";
import type { PaymentAttempt } from "./entity/payment-attempt.entity.js";

@injectable()
export default class PaymentAttemptMapper {
  toPaymentAttemptEntity(paymentAttempt: PrismaPaymentAttempt): PaymentAttempt {
    return {
      id: paymentAttempt.id,
      paymentOrderId: paymentAttempt.paymentOrderId,
      paymentMethodId: paymentAttempt.paymentMethodId,
      attemptNumber: paymentAttempt.attemptNumber,
      status: paymentAttempt.status,
      failureCode: paymentAttempt.failureCode ?? null,
      reason: paymentAttempt.reason ?? null,
      createdAt: new Date(paymentAttempt.createdAt),
      updatedAt: new Date(paymentAttempt.updatedAt),
    };
  }
}
