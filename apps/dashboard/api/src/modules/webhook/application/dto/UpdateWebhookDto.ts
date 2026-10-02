export interface UpdateWebhookInputDto {
  userId: string;
  merchantId: string;
  webhookId: string;
  url?: string;
}
