import { prisma, Tx } from "@/core/prisma/prisma.client";
import { Prisma } from "@/generated/prisma";
import { inject, injectable } from "inversify";
import { Payment } from "../entity/payment.entity";
import PaymentMapper from "../payment.mapper";
import TYPES from "@/core/di/inversify.types";

@injectable()
export default class PaymentRepository {
  private readonly db = prisma;
  constructor(
    @inject(TYPES.PaymentMapper) private readonly mapper: PaymentMapper,
  ) {}

  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    const payment = await this.db.payment.create({ data });
    return this.mapper.toPaymentEntity(payment);
  }

  async findById(tx: Tx | null, id: string): Promise<Payment | null> {
    const payment = await (tx ?? this.db).payment.findUnique({ where: { id } });
    return payment ? this.mapper.toPaymentEntity(payment) : null;
  }
}
