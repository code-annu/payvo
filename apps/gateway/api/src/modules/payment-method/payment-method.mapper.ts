import type { PaymentMethod as PrismaPaymentMethod } from "@payvo/database/types";
import { injectable } from "inversify";
import type { PaymentMethod } from "./entity/payment-method.entity.js";

@injectable()
export default class PaymentMethodMapper {
  toPaymentMethodEntity(paymentMethod: PrismaPaymentMethod): PaymentMethod {
    return {
      id: paymentMethod.id,
      code: paymentMethod.code,
      name: paymentMethod.name,
      iconUrl: paymentMethod.iconUrl,
      createdAt: new Date(paymentMethod.createdAt),
      updatedAt: new Date(paymentMethod.updatedAt),
    };
  }
}
