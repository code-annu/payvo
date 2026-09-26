import { inject, injectable } from "inversify";
import { client } from "@payvo/database/client";
import type { TransactionClient } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import PaymentMethodMapper from "../payment-method.mapper.js";
import type { PaymentMethod } from "../entity/payment-method.entity.js";

@injectable()
export default class PaymentMethodRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.PaymentMethodMapper)
    private readonly mapper: PaymentMethodMapper,
  ) {}

  async findAll(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.db.orm.public.PaymentMethod.all();
    return paymentMethods.map((paymentMethod) =>
      this.mapper.toPaymentMethodEntity(paymentMethod),
    );
  }

  async findByCode(
    tx: TransactionClient,
    code: string,
  ): Promise<PaymentMethod | null> {
    const paymentMethod = await tx.orm.public.PaymentMethod.first({ code });
    return paymentMethod
      ? this.mapper.toPaymentMethodEntity(paymentMethod)
      : null;
  }
}
