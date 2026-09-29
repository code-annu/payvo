export interface CheckoutPaymentOrderDto {
  readonly id: string;
  readonly csi: string;
  readonly amount: number;
  readonly currency: string;
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
