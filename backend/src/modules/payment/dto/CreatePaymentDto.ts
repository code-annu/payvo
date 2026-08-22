export interface CreatePaymentDto {
  customerId: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  description?: string | null;
}
