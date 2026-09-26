import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import PaymentMethodRepository from "@/modules/payment-method/repository/payment-method.repository.js";
import { PaymentOrderNotFoundError } from "../../error/payment-order.errors.js";
import PaymentOrderRepository from "../../repository/payment-order.repository.js";
import type { CheckoutPaymentOrderOutputDto } from "../dto/CheckoutPaymentOrderDto.js";

@injectable()
export default class CheckoutPaymentOrderUsecase {
  constructor(
    @inject(TYPES.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
    @inject(TYPES.PaymentMethodRepository)
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(csi: string): Promise<CheckoutPaymentOrderOutputDto> {
    const paymentOrder = await this.paymentOrderRepository.findByCsi(csi);

    if (!paymentOrder) {
      throw new PaymentOrderNotFoundError();
    }

    const paymentMethods = await this.paymentMethodRepository.findAll();

    return {
      paymentOrder: {
        id: paymentOrder.id,
        csi: paymentOrder.csi,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: paymentOrder.status,
        expiresAt: paymentOrder.expiresAt,
      },
      paymentMethods: paymentMethods.map((paymentMethod) => ({
        id: paymentMethod.id,
        code: paymentMethod.code,
        name: paymentMethod.name,
        iconUrl: paymentMethod.iconUrl,
      })),
    };
  }
}
