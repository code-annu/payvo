export interface PaymentMethod {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly iconUrl: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
