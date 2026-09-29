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

  async create(data: PaymentOrderCreateInput): Promise<PaymentOrder> {
    const paymentOrder = await this.db.orm.public.PaymentOrder.create(data);
    return this.mapper.toPaymentOrderEntity(paymentOrder);
  }

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

  async markCompleted(
    tx: TransactionClient,
    data: { id: string; completedAt: Date },
  ): Promise<PaymentOrder | null> {
    const { id, completedAt } = data;
    const order = await tx.orm.public.PaymentOrder.where({ id })
      .where((po) => po.completedAt.isNull())
      .update({
        completedAt: completedAt.toISOString(),
      });

    return order ? this.mapper.toPaymentOrderEntity(order) : null;
  }
}
