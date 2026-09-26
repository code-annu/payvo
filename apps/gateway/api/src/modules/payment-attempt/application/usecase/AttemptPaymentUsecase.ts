import { inject, injectable } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import PaymentMethodRepository from "@/modules/payment-method/repository/payment-method.repository.js";
import { PaymentMethodNotFoundError } from "@/modules/payment-method/error/payment-method.errors.js";
import {
  PaymentOrderInvalidState,
  PaymentOrderNotFoundError,
} from "@/modules/payment-order/error/payment-order.errors.js";
import type { PaymentOrderStatus } from "@/modules/payment-order/entity/payment-order.entity.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import PaymentAttemptRepository from "../../repository/payment-attempt.repository.js";
import type {
  AttemptPaymentInputDto,
  AttemptPaymentOutputDto,
} from "../dto/AttemptPaymentDto.js";

@injectable()
export default class AttemptPaymentUsecase {
  constructor(
    @inject(TYPES.PaymentMethodRepository)
    private readonly paymentMethodRepository: PaymentMethodRepository,
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
    @inject(TYPES.PaymentAttemptRepository)
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
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

      if (!paymentMethod) {
        throw new PaymentMethodNotFoundError();
      }

      const paymentOrder = await this.paymentOrderRepository.markPaymentPending(
        tx,
        { id: input.paymentOrderId, now },
      );

      if (!paymentOrder) {
        const currentOrder = await this.paymentOrderRepository.findById(
          tx,
          input.paymentOrderId,
        );

        if (!currentOrder) {
          throw new PaymentOrderNotFoundError();
        }

        const message = this.getInvalidStateMessage(currentOrder.status);
        throw new PaymentOrderInvalidState(message, {
          orderStatus: currentOrder.status,
        });
      }

      const attemptNumber =
        await this.paymentAttemptRepository.getNextAttemptNumber(
          tx,
          paymentOrder.id,
        );

      const paymentAttempt = await this.paymentAttemptRepository.create(tx, {
        paymentOrderId: paymentOrder.id,
        paymentMethodId: paymentMethod.id,
        attemptNumber,
        status: "PROCESSING",
      });

      return {
        paymentOrderId: paymentAttempt.paymentOrderId,
        paymentMethodCode: paymentMethod.code,
      };
    });
  }

  private getInvalidStateMessage(status: PaymentOrderStatus): string {
    switch (status) {
      case "PAYMENT_PENDING":
        return "Payment order already has a payment attempt in progress";
      case "EXPIRED":
        return "Payment order has expired";
      case "COMPLETED":
        return "Payment order has already been completed";
      default:
        return `Payment order cannot be attempted in its current state (${status})`;
    }
  }
}
