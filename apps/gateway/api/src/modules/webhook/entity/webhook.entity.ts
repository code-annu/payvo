export interface Webhook {
  readonly id: string;
  readonly merchantId: string;
  readonly secretKey: string;
  readonly url: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
