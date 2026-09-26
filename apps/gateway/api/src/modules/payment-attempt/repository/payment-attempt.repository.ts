import { inject, injectable } from "inversify";
import type { TransactionClient } from "@payvo/database/client";
import type { PaymentAttemptCreateInput } from "@payvo/database/types";
import TYPES from "@/core/di/inversify.types.js";
import PaymentAttemptMapper from "../payment-attempt.mapper.js";
import type { PaymentAttempt } from "../entity/payment-attempt.entity.js";

@injectable()
export default class PaymentAttemptRepository {
  constructor(
    @inject(TYPES.PaymentAttemptMapper)
    private readonly mapper: PaymentAttemptMapper,
  ) {}

  async getNextAttemptNumber(
    tx: TransactionClient,
    paymentOrderId: string,
  ): Promise<number> {
    const attempts = await tx.orm.public.PaymentAttempt.where({
      paymentOrderId,
    }).all();

    return (
      attempts.reduce(
        (highest, attempt) => Math.max(highest, attempt.attemptNumber),
        0,
      ) + 1
    );
  }

  async create(
    tx: TransactionClient,
    data: PaymentAttemptCreateInput,
  ): Promise<PaymentAttempt> {
    const paymentAttempt = await tx.orm.public.PaymentAttempt.create(data);
    return this.mapper.toPaymentAttemptEntity(paymentAttempt);
  }
}
