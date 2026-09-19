import { client, TransactionClient } from "@payvo/database/client";
import { CheckoutSessionCreateInput } from "@payvo/database/types";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import CheckoutSessionMapper from "../checkout-session.mapper.js";
import { CheckoutSession } from "../entity/checkout-session.entity.js";

@injectable()
export default class CheckoutSessionRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.CheckoutSessionMapper)
    private readonly mapper: CheckoutSessionMapper,
  ) {}

  async create(
    tx: TransactionClient,
    data: CheckoutSessionCreateInput,
  ): Promise<CheckoutSession> {
    const session = await tx.orm.public.CheckoutSession.create(data);
    return this.mapper.toCheckoutSessionEntity(session);
  }

  async revokeAllByPaymentOrderId(
    tx: TransactionClient,
    paymentOrderId: string,
  ): Promise<void> {
    await tx.orm.public.CheckoutSession.where({ paymentOrderId }).updateAll({
      status: "REVOKED",
    });
  }
}
