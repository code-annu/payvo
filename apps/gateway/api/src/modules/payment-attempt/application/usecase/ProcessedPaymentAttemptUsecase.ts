import { inject, injectable } from "inversify";
import { ProcessedPaymentAttemptInputDto } from "../dto/ProcessedPaymentAttemptDto.js";
import TYPES from "@/core/di/inversify.types.js";
import PaymentAttemptRepository from "../../repository/payment-attempt.repository.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import { dbTransaction } from "@payvo/database/client";
import {
  PaymentAttemptInvalidStateError,
  PaymentAttemptNotFoundError,
} from "../../error/payment-attempt.errors.js";
import { isAfter } from "date-fns";
import {
  PaymentOrderInvalidStateError,
  PaymentOrderNotFoundError,
} from "@/modules/payment-order/error/payment-order.errors.js";

@injectable()
export default class ProcessedPaymentAttemptUsecase {
  constructor(
    @inject(TYPES.PaymentAttemptRepository)
    private readonly paymentAttemptRepo: PaymentAttemptRepository,
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepo: PaymentOrderRepository,
  ) {}

  async execute(input: ProcessedPaymentAttemptInputDto) {
    const { processed, paymentAttemptId } = input;
    const now = new Date();
    if (processed) {
      dbTransaction(async (tx) => {
        const attempt = await this.paymentAttemptRepo.findById(
          tx,
          paymentAttemptId,
        );
        if (!attempt) throw new PaymentAttemptNotFoundError();
        if (attempt.status !== "PROCESSING") {
          throw new PaymentAttemptInvalidStateError(
            "Only PROCESSING payment attempts can be processed",
            { attemptStatus: attempt.status },
          );
        }

        const order = await this.paymentOrderRepo.findById(
          tx,
          attempt.paymentOrderId,
        );
        if (!order) throw new PaymentOrderNotFoundError();

        const succeedAttempt = await this.paymentAttemptRepo.markAttemptSucceed(
          tx,
          { id: paymentAttemptId, completedAt: now },
        );
        if (!succeedAttempt) {
          throw new PaymentAttemptInvalidStateError(
            "Failed to update payment attempt",
            { attemptStatus: attempt.status },
          );
        }

        const completedOrder = await this.paymentOrderRepo.markCompleted(tx, {
          id: attempt.paymentOrderId,
          completedAt: now,
          isLatePayment: isAfter(now, order.expiresAt),
        });

        if (!completedOrder) {
          throw new PaymentOrderInvalidStateError(
            "Failed to update payment order",
            { orderStatus: order.status },
          );
        }

        // Call webhook
        console.log("Webhook called");

        return completedOrder;
      });
    }
  }
}
