import type { SuccessResponse } from "@/core/api/success.response";

export interface WebhookListItem {
  readonly id: string;
  readonly url: string;
}

export interface MerchantWebhooksData {
  readonly merchantId: string;
  readonly webhooks: readonly WebhookListItem[];
}

export interface WebhookDetailsData {
  readonly id: string;
  readonly merchantId: string;
  readonly secretKey: string;
  readonly url: string;
}

export interface CreateWebhookPayload {
  readonly url: string;
}

export interface UpdateWebhookPayload {
  readonly url?: string;
}

export type MerchantWebhooksResponse = SuccessResponse<MerchantWebhooksData>;
export type WebhookDetailsResponse = SuccessResponse<WebhookDetailsData>;
export type CreateWebhookResponse = SuccessResponse<WebhookDetailsData>;
export type UpdateWebhookResponse = SuccessResponse<WebhookDetailsData>;
