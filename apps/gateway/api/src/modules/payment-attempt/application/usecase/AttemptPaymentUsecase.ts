import { inject, injectable } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import PaymentMethodRepository from "@/modules/payment-method/repository/payment-method.repository.js";
import { PaymentMethodNotFoundError } from "@/modules/payment-method/error/payment-method.errors.js";
import {
  PaymentOrderCompletedError,
  PaymentOrderExpiredError,
  PaymentOrderNotFoundError,
  PaymentOrderPaymentPendingError,
} from "@/modules/payment-order/error/payment-order.errors.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import PaymentAttemptRepository from "../../repository/payment-attempt.repository.js";
import type {
  AttemptPaymentInputDto,
  AttemptPaymentOutputDto,
} from "../dto/AttemptPaymentDto.js";
import PaymentProvider from "@/provider/payment.provider.js";
import { isBefore } from "date-fns";

@injectable()
export default class AttemptPaymentUsecase {
  constructor(
    @inject(TYPES.PaymentMethodRepository)
    private readonly paymentMethodRepository: PaymentMethodRepository,
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
    @inject(TYPES.PaymentAttemptRepository)
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    @inject(TYPES.PaymentProvider)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(
    input: AttemptPaymentInputDto,
  ): Promise<AttemptPaymentOutputDto> {
    const now = new Date();
    return dbTransaction(async (tx) => {
      const paymentMethod = await this.paymentMethodRepository.findByCode(
        tx,
        input.paymentMethodCode,
      );
      if (!paymentMethod) throw new PaymentMethodNotFoundError();

      const order = await this.paymentOrderRepository.findById(
        tx,
        input.paymentOrderId,
      );
      if (!order) throw new PaymentOrderNotFoundError();
      if (order.completedAt) {
        throw new PaymentOrderCompletedError(
          "Cannot attempt a payment which is already completed",
        );
      }
      if (isBefore(order.expiresAt, now)) {
        throw new PaymentOrderExpiredError(
          "Expired order cannot be attempted for payment",
        );
      }

      const attemptNumber =
        await this.paymentAttemptRepository.getNextAttemptNumber(tx, order.id);

      const paymentAttempt = await this.paymentAttemptRepository.create(tx, {
        paymentOrderId: order.id,
        paymentMethodId: paymentMethod.id,
        attemptNumber,
        status: "PROCESSING",
      });

      this.paymentProvider.processPayment({
        paymentMethodId: paymentMethod.id,
        paymentAttemptId: paymentAttempt.id,
      });

      return {
        paymentAttemptId: paymentAttempt.id,
        paymentMethod: {
          id: paymentMethod.id,
          code: paymentMethod.code,
          name: paymentMethod.name,
        },
        status: paymentAttempt.status,
      };
    });
  }
}
