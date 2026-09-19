import { generateId } from "@payvo/shared/crypto";
import { CreateCheckoutSessionDto } from "../dto/CreateCheckoutSessionDto.js";
import { inject, injectable } from "inversify";
import { paymentConfig } from "@payvo/config/payment";
import { dbTransaction } from "@payvo/database/client";
import { addMinutes, isAfter, min } from "date-fns";
import TYPES from "@/core/di/inversify.types.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import CheckoutSessionRepository from "../../repository/checkout-session.repository.js";
import { PaymentOrderExpiredError } from "@/modules/payment-order/errors/payment-order.errors.js";
import { InvalidCheckoutSessionExpiryError } from "../../error/checkout-session.errors.js";

@injectable()
export default class CreateCheckoutSessionUsecase {
  constructor(
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
    @inject(TYPES.CheckoutSessionRepository)
    private readonly checkoutSessionRepository: CheckoutSessionRepository,
  ) {}

  async execute(dto: CreateCheckoutSessionDto) {
    const now = new Date();
    const existingOrder =
      await this.paymentOrderRepository.findByIdempotencyKey(
        dto.merchantId,
        dto.idempotencyKey,
      );

    if (existingOrder && !isAfter(existingOrder.expiresAt, now)) {
      throw new PaymentOrderExpiredError();
    }

    const paymentOrderExpiresAt = addMinutes(
      now,
      paymentConfig.order.expiryMinutes,
    );

    const checkoutSessionExpiresAt = min([
      addMinutes(now, paymentConfig.checkoutSession.expiryMinutes),
      existingOrder?.expiresAt ?? paymentOrderExpiresAt,
    ]);

    if (!isAfter(checkoutSessionExpiresAt, now)) {
      throw new InvalidCheckoutSessionExpiryError();
    }

    return dbTransaction(async (tx) => {
      if (existingOrder) {
        await this.checkoutSessionRepository.revokeAllByPaymentOrderId(
          tx,
          existingOrder.id,
        );
      }
      const paymentOrder =
        existingOrder ??
        (await this.paymentOrderRepository.create(tx, {
          merchantId: dto.merchantId,
          merchantCustomerId: dto.merchantCustomerId,
          merchantOrderId: dto.merchantOrderId,
          idempotencyKey: dto.idempotencyKey,
          amount: dto.amount.toString(),
          currency: dto.currency as any,
          expiresAt: paymentOrderExpiresAt.toISOString(),
        }));

      const checkoutSession = await this.checkoutSessionRepository.create(tx, {
        csi: generateId(32),
        paymentOrderId: paymentOrder.id,
        expiresAt: checkoutSessionExpiresAt.toISOString(),
      });

      return {
        checkoutUrl: this.buildCheckoutUrl(checkoutSession.csi),
      };
    });
  }

  private buildCheckoutUrl(csi: string): string {
    return `${paymentConfig.checkoutSession.baseUrl}?csi=${encodeURIComponent(csi)}`;
  }
}
