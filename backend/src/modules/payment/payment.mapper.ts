import { Payment as PrismaPayment } from "@/generated/prisma";
import { injectable } from "inversify";
import { Payment, PaymentStatus } from "./entity/payment.entity";

@injectable()
export default class PaymentMapper {
  toPaymentEntity(payment: PrismaPayment): Payment {
    return {
      id: payment.id,
      merchantId: payment.merchantId,
      customerId: payment.customerId,
      orderId: payment.orderId,
      idempotencyKey: payment.idempotencyKey,
      status: payment.status as PaymentStatus,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      providerTransactionId: payment.providerTransactionId,
      failureCode: payment.failureCode,
      failureMessage: payment.failureMessage,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
