import { inject, injectable } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import PaymentMethodRepository from "@/modules/payment-method/repository/payment-method.repository.js";
import { PaymentMethodNotFoundError } from "@/modules/payment-method/error/payment-method.errors.js";
import * as paymentOrderErrors from "@/modules/payment-order/error/payment-order.errors.js";
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

      const updatedOrder = await this.paymentOrderRepository.markingProcessing(
        tx,
        { id: input.paymentOrderId, now },
      );
      if (!updatedOrder) {
        const order = await this.paymentOrderRepository.findById(
          tx,
          input.paymentOrderId,
        );
        if (
          order &&
          (order.status === "PAYMENT_PROCESSING" ||
            order.status === "COMPLETED" ||
            order.status === "EXPIRED" ||
            isBefore(order.expiresAt, now))
        ) {
          throw new paymentOrderErrors.PaymentOrderInvalidState(
            "Order is not in valid state to attempt payment",
            { paymentOrderStatus: order.status },
          );
        }

        throw new paymentOrderErrors.PaymentOrderNotFoundError();
      }

      const attemptNumber =
        await this.paymentAttemptRepository.getNextAttemptNumber(
          tx,
          updatedOrder.id,
        );

      const paymentAttempt = await this.paymentAttemptRepository.create(tx, {
        paymentOrderId: updatedOrder.id,
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
