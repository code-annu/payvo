import { PaymentAttemptStatus } from "../../entity/payment-attempt.entity.js";

export interface AttemptPaymentInputDto {
  paymentOrderId: string;
  paymentMethodCode: string;
}

export interface AttemptPaymentOutputDto {
  paymentAttemptId: string;
  paymentMethod: {
    id: string;
    code: string;
    name: string;
  };
  status: PaymentAttemptStatus;
}
