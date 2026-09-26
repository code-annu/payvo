import { client } from "@payvo/database/client";
import type {
  PaymentMethod,
  PaymentMethodCreateInput,
} from "@payvo/database/types";

export default abstract class PaymentMethodFactory {
  private static db = client;

  static async createPaymentMethod(
    overrides: Partial<PaymentMethodCreateInput> = {},
  ): Promise<PaymentMethod> {
    return this.db.orm.public.PaymentMethod.create({
      code: `payment_method_${crypto.randomUUID()}`,
      name: "Test payment method",
      iconUrl: "https://example.com/test-payment-method.svg",
      ...overrides,
    });
  }
}