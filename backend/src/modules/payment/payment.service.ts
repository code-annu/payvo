import TYPES from "@/core/di/inversify.types";
import { inject, injectable } from "inversify";
import PaymentRepository from "./repository/payment.repository";
import MerchantRepository from "./merchant/repository/merchant.repository";
import { CreatePaymentDto } from "./dto/CreatePaymentDto";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
} from "./merchant/merchant.errors";

@injectable()
export default class PaymentService {
  constructor(
    @inject(TYPES.PaymentRepository)
    private readonly paymentRepo: PaymentRepository,
    @inject(TYPES.MerchantRepository)
    private readonly merchantRepo: MerchantRepository,
  ) {}

  async createPayment(merchantId: string, input: CreatePaymentDto) {
    const merchant = await this.merchantRepo.findById(merchantId);
    if (!merchant) throw new MerchantNotFoundError();
    if (!merchant.isActive) {
      throw new MerchantInactiveError(
        "Inactive merchant cannot create payments",
      );
    }
    const payment = await this.paymentRepo.create({
      merchantId,
      customerId: input.customerId,
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      amount: input.amount,
      currency: input.currency,
      description: input.description ?? null,
    });

    return { payment };
  }
}
