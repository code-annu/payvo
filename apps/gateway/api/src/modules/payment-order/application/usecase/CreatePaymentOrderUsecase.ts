import { inject, injectable } from "inversify";
import { generateId } from "@payvo/shared/crypto";
import { paymentConfig } from "@payvo/config/payment";
import { addMinutes } from "date-fns";
import TYPES from "@/core/di/inversify.types.js";
import type {
  CreatePaymentOrderInputDto,
  CreatePaymentOrderOutputDto,
} from "../dto/CreatePaymentOrderDto.js";
import PaymentOrderRepository from "../../repository/payment-order.repository.js";

@injectable()
export default class CreatePaymentOrderUsecase {
  constructor(
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
  ) {}

  async execute(
    input: CreatePaymentOrderInputDto,
  ): Promise<CreatePaymentOrderOutputDto> {
    const existingOrder =
      await this.paymentOrderRepository.findByIdempotencyKey(
        input.idempotencyKey,
      );

    if (existingOrder) {
      return { checkoutUrl: this.buildCheckoutUrl(existingOrder.csi) };
    }

    const now = new Date();
    const paymentOrder = await this.paymentOrderRepository.create({
      merchantId: input.merchantId,
      merchantCustomerId: input.merchantCustomerId,
      merchantOrderId: input.merchantOrderId,
      idempotencyKey: input.idempotencyKey,
      csi: generateId(16),
      amount: input.amount.toString(),
      currency: input.currency as any,
      status: "CREATED",
      expiresAt: addMinutes(
        now,
        paymentConfig.order.expiryMinutes,
      ).toISOString(),
    });

    return { checkoutUrl: this.buildCheckoutUrl(paymentOrder.csi) };
  }

  private buildCheckoutUrl(csi: string): string {
    return `${paymentConfig.order.checkoutBaseUrl.replace(/\/$/, "")}/${csi}`;
  }
}
