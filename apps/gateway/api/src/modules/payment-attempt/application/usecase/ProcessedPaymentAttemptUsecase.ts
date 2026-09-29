import { inject, injectable } from "inversify";
import { ProcessedPaymentAttemptInputDto } from "../dto/ProcessedPaymentAttemptDto.js";
import TYPES from "@/core/di/inversify.types.js";
import PaymentAttemptRepository from "../../repository/payment-attempt.repository.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import {
  PaymentAttemptInvalidStateError,
  PaymentAttemptNotFoundError,
} from "../../error/payment-attempt.errors.js";
import { PaymentOrderNotFoundError } from "@/modules/payment-order/error/payment-order.errors.js";

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

    await dbTransaction(async (tx) => {
      if (processed) {
        await this.handleProcessed(tx, paymentAttemptId);
      } else {
        await this.handleNotProcessed(tx, paymentAttemptId);
      }
    });

    console.log("Payment is processed!!!");
  }

  private async handleProcessed(
    tx: TransactionClient,
    paymentAttemptId: string,
  ) {
    const now = new Date();
    const succeedAttempt = await this.paymentAttemptRepo.markSucceed(tx, {
      id: paymentAttemptId,
    });

    if (!succeedAttempt) {
      const attempt = await this.paymentAttemptRepo.findById(
        tx,
        paymentAttemptId,
      );
      if (attempt && attempt.status !== "PROCESSING") {
        throw new PaymentAttemptInvalidStateError(
          "Only processing attempt can be succeed",
          {
            attemptStatus: attempt.status,
          },
        );
      }
      throw new PaymentAttemptNotFoundError("Attempt not found");
    }

    const completedOrder = await this.paymentOrderRepo.markCompleted(tx, {
      id: succeedAttempt.paymentOrderId,
      completedAt: now,
    });
    if (!completedOrder) {
      throw new PaymentOrderNotFoundError("Order not found");
    }
  }

  private async handleNotProcessed(
    tx: TransactionClient,
    paymentAttemptId: string,
  ) {
    const failedAttempt = await this.paymentAttemptRepo.markFailed(tx, {
      id: paymentAttemptId,
      reason: "Payment failed",
    });

    if (!failedAttempt) {
      const attempt = await this.paymentAttemptRepo.findById(
        tx,
        paymentAttemptId,
      );
      if (attempt && attempt.status !== "PROCESSING") {
        throw new PaymentAttemptInvalidStateError(
          "Only processing attempt can be failed",
          {
            attemptStatus: attempt.status,
          },
        );
      }
      throw new PaymentAttemptNotFoundError("Attempt not found");
    }

    const order = await this.paymentOrderRepo.findById(
      tx,
      failedAttempt.paymentOrderId,
    );
    if (!order) {
      throw new PaymentOrderNotFoundError("Order not found");
    }
  }
}

