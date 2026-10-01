export interface CreateWebhookInputDto {
  merchantId: string;
  userId: string;
  url: string;
}

export interface CreatedWebhookOutputDto {
  id: string;
  merchantId: string;
  url: string;
  secretKey: string;
}
