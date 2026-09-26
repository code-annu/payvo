import type { PaymentOrderStatus } from "../../entity/payment-order.entity.js";

export interface CheckoutPaymentOrderDto {
  readonly id: string;
  readonly csi: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: PaymentOrderStatus;
  readonly expiresAt: Date;
}

export interface CheckoutPaymentMethodDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly iconUrl: string;
}

export interface CheckoutPaymentOrderOutputDto {
  readonly paymentOrder: CheckoutPaymentOrderDto;
  readonly paymentMethods: CheckoutPaymentMethodDto[];
}
