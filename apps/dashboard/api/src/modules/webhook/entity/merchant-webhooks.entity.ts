export interface MerchantWebhooks {
  readonly merchantId: string;
  readonly webhooks: {
    readonly id: string;
    readonly url: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }[];
}