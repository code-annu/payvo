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

  async markingProcessing(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<PaymentOrder | null> {
    const { id, now } = data;
    const order = await tx.orm.public.PaymentOrder.where({ id })
      .where((po) => po.completedAt.isNull())
      .where((po) => po.status.in(["CREATED", "PAYMENT_FAILED"]))
      .where((po) => po.expiresAt.gt(now.toISOString()))
      .update({
        status: "PAYMENT_PROCESSING",
      });
    return order ? this.mapper.toPaymentOrderEntity(order) : null;
  }

  async markCompleted(
    tx: TransactionClient,
    data: { id: string; completedAt: Date },
  ): Promise<PaymentOrder | null> {
    const { id, completedAt } = data;
    const order = await tx.orm.public.PaymentOrder.where({ id })
      .where((po) => po.completedAt.isNull())
      .where((po) => po.status.in(["PAYMENT_PROCESSING", "EXPIRED"]))
      .update({
        completedAt: completedAt.toISOString(),
        status: "COMPLETED",
      });

    return order ? this.mapper.toPaymentOrderEntity(order) : null;
  }

  async markFailed(
    tx: TransactionClient,
    data: { id: string },
  ): Promise<PaymentOrder | null> {
    const { id } = data;
    const order = await tx.orm.public.PaymentOrder.where({ id })
      .where((po) => po.completedAt.isNull())
      .where((po) => po.status.in(["PAYMENT_PROCESSING", "EXPIRED"]))
      .update({
        status: "PAYMENT_FAILED",
      });

    return order ? this.mapper.toPaymentOrderEntity(order) : null;
  }
}
