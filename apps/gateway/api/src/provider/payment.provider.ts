import TYPES from "@/core/di/inversify.types.js";
import {
  getRandomSuccess,
  getRandomTimeout,
} from "@/core/helper/random.helper.js";
import ProcessedPaymentAttemptUsecase from "@/modules/payment-attempt/application/usecase/ProcessedPaymentAttemptUsecase.js";
import { inject, injectable } from "inversify";

interface ProcessPaymentInput {
  paymentMethodId: string;
  paymentAttemptId: string;
}

@injectable()
export default class PaymentProvider {
  constructor(
    @inject(TYPES.ProcessedPaymentAttemptUsecase)
    private readonly processedPaymentAttemptUsecase: ProcessedPaymentAttemptUsecase,
  ) {}

  async processPayment(input: ProcessPaymentInput) {
    const timeout = getRandomTimeout();
    const result = await new Promise<{ processed: boolean }>((resolve) =>
      setTimeout(() => resolve({ processed: getRandomSuccess() }), timeout),
    );

    await this.processedPaymentAttemptUsecase.execute({
      paymentAttemptId: input.paymentAttemptId,
      processed: result.processed,
    });
  }
}
