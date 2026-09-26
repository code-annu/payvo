import { inject, injectable } from "inversify";
import { client, type TransactionClient } from "@payvo/database/client";
import type { PaymentOrderCreateInput } from "@payvo/database/types";
import TYPES from "@/core/di/inversify.types.js";
import PaymentOrderMapper from "../payment-order.mapper.js";
import type { PaymentOrder } from "../entity/payment-order.entity.js";

@injectable()
export default class PaymentOrderRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.PaymentOrderMapper)
    private readonly mapper: PaymentOrderMapper,
  ) {}

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentOrder | null> {
    const paymentOrder = await this.db.orm.public.PaymentOrder.first({
      idempotencyKey,
    });

    return paymentOrder ? this.mapper.toPaymentOrderEntity(paymentOrder) : null;
  }

  async findByCsi(csi: string): Promise<PaymentOrder | null> {
    const paymentOrder = await this.db.orm.public.PaymentOrder.first({ csi });

    return paymentOrder ? this.mapper.toPaymentOrderEntity(paymentOrder) : null;
  }

  async findById(
    tx: TransactionClient,
    id: string,
  ): Promise<PaymentOrder | null> {
    const paymentOrder = await tx.orm.public.PaymentOrder.first({ id });
    return paymentOrder ? this.mapper.toPaymentOrderEntity(paymentOrder) : null;
  }

  async markPaymentPending(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<PaymentOrder | null> {
    const paymentOrder = await tx.orm.public.PaymentOrder.where({ id: data.id })
      .where((order) => order.status.in(["CREATED", "FAILED"]))
      .where((po) => po.expiresAt.gte(data.now.toISOString()))
      .update({ status: "PAYMENT_PENDING" });

    return paymentOrder ? this.mapper.toPaymentOrderEntity(paymentOrder) : null;
  }

  async create(data: PaymentOrderCreateInput): Promise<PaymentOrder> {
    const paymentOrder = await this.db.orm.public.PaymentOrder.create(data);
    return this.mapper.toPaymentOrderEntity(paymentOrder);
  }
}
