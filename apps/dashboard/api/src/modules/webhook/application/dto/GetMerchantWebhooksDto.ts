export interface GetMerchantWebhooksInputDto {
  merchantId: string;
  userId: string;
}

export interface GetMerchantWebhooksOutputDto {
  merchantId: string;
  webhooks: {
    id: string;
    url: string;
  }[];
}
