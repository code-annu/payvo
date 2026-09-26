export interface AttemptPaymentInputDto {
  paymentOrderId: string;
  paymentMethodCode: string;
}

export interface AttemptPaymentOutputDto {
  paymentOrderId: string;
  paymentMethodCode: string;
}
