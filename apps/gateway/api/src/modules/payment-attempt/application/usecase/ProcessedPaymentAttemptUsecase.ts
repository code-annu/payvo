import { inject, injectable } from "inversify";
import { ProcessedPaymentAttemptInputDto } from "../dto/ProcessedPaymentAttemptDto.js";
import TYPES from "@/core/di/inversify.types.js";
import PaymentAttemptRepository from "../../repository/payment-attempt.repository.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import TransactionRepository from "@/modules/transaction/repository/transaction.repository.js";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import {
  PaymentAttemptInvalidStateError,
  PaymentAttemptNotFoundError,
} from "../../error/payment-attempt.errors.js";
import * as paymentOrderErrors from "@/modules/payment-order/error/payment-order.errors.js";
import WebhookWorker from "@/workers/webhook/webhook.worker.js";
import { isBefore } from "date-fns";

const TRANSACTION_FEE = 0.02;

@injectable()
export default class ProcessedPaymentAttemptUsecase {
  constructor(
    @inject(TYPES.PaymentAttemptRepository)
    private readonly paymentAttemptRepo: PaymentAttemptRepository,
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepo: PaymentOrderRepository,
    @inject(TYPES.TransactionRepository)
    private readonly transactionRepo: TransactionRepository,
    @inject(TYPES.WebhookWorker)
    private readonly webhookWorker: WebhookWorker,
  ) {}

  async execute(input: ProcessedPaymentAttemptInputDto) {
    const { processed, paymentAttemptId } = input;

    await dbTransaction(async (tx) => {
      if (processed) {
        const order = await this.handleProcessed(tx, paymentAttemptId);
        this.webhookWorker.sendPaymentWebhook(order.merchantId, {
          event: "payment.succeed",
          data: {
            paymentOrderId: order.id,
            paymentAttemptId: paymentAttemptId,
            amount: order.amount,
            currency: order.currency,
          },
        });
      } else {
        const order = await this.handleNotProcessed(tx, paymentAttemptId);
        this.webhookWorker.sendPaymentWebhook(order.merchantId, {
          event: "payment.failed",
          data: {
            paymentOrderId: order.id,
            paymentAttemptId: paymentAttemptId,
            amount: order.amount,
            currency: order.currency,
          },
        });
      }
    });
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
          { attemptStatus: attempt.status },
        );
      }
      throw new PaymentAttemptNotFoundError("Attempt not found");
    }

    const completedOrder = await this.paymentOrderRepo.markCompleted(tx, {
      id: succeedAttempt.paymentOrderId,
      completedAt: now,
    });
    if (!completedOrder) {
      const order = await this.paymentOrderRepo.findById(
        tx,
        succeedAttempt.paymentOrderId,
      );
      if (
        order &&
        order.status !== "PAYMENT_PROCESSING" &&
        order.status !== "EXPIRED"
      ) {
        throw new paymentOrderErrors.PaymentOrderInvalidState(
          "Cannot complete order as order is not in valid state",
          { paymentOrderStatus: order.status },
        );
      }

      throw new paymentOrderErrors.PaymentOrderNotFoundError(
        "Cannot find order to mark completed",
      );
    }

    await this.transactionRepo.create(tx, {
      merchantId: completedOrder.merchantId,
      paymentOrderId: completedOrder.id,
      paymentAttemptId: succeedAttempt.id,
      paymentType: "PAYIN",
      grossAmount: completedOrder.amount.toString(),
      feeAmount: (completedOrder.amount * TRANSACTION_FEE).toString(),
      netAmount: (completedOrder.amount * (1 - TRANSACTION_FEE)).toString(),
      currency: completedOrder.currency as any,
    });

    return completedOrder;
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
          { attemptStatus: attempt.status },
        );
      }
      throw new PaymentAttemptNotFoundError("Attempt not found");
    }

    const failedOrder = await this.paymentOrderRepo.markFailed(tx, {
      id: failedAttempt.paymentOrderId,
    });
    if (!failedOrder) {
      const order = await this.paymentOrderRepo.findById(
        tx,
        failedAttempt.paymentOrderId,
      );
      if (
        order &&
        order.status !== "PAYMENT_PROCESSING" &&
        order.status !== "EXPIRED"
      ) {
        throw new paymentOrderErrors.PaymentOrderInvalidState(
          "Order is not in valid state to mark failed",
          { paymentOrderStatus: order.status },
        );
      }
      throw new paymentOrderErrors.PaymentOrderNotFoundError("Order not found");
    }
    return failedOrder;
  }
}
