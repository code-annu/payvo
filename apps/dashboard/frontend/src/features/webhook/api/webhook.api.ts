import axiosClient from "@/core/axios/axios.client";
import type {
  CreateWebhookPayload,
  CreateWebhookResponse,
  MerchantWebhooksData,
  MerchantWebhooksResponse,
  UpdateWebhookPayload,
  UpdateWebhookResponse,
  WebhookDetailsData,
  WebhookDetailsResponse,
} from "./webhook.types";

export default abstract class WebhookApi {
  static async getMerchantWebhooks(
    merchantId: string,
  ): Promise<MerchantWebhooksData> {
    const response = await axiosClient.get<MerchantWebhooksResponse>(
      `/merchants/${merchantId}/webhooks`,
    );
    return response.data.data;
  }

  static async createWebhook(
    merchantId: string,
    payload: CreateWebhookPayload,
  ): Promise<WebhookDetailsData> {
    const response = await axiosClient.post<CreateWebhookResponse>(
      `/merchants/${merchantId}/webhooks`,
      payload,
    );
    return response.data.data;
  }

  static async getWebhookDetails(
    merchantId: string,
    webhookId: string,
  ): Promise<WebhookDetailsData> {
    const response = await axiosClient.get<WebhookDetailsResponse>(
      `/merchants/${merchantId}/webhooks/${webhookId}`,
    );
    return response.data.data;
  }

  static async updateWebhook(
    merchantId: string,
    webhookId: string,
    payload: UpdateWebhookPayload,
  ): Promise<WebhookDetailsData> {
    const response = await axiosClient.patch<UpdateWebhookResponse>(
      `/merchants/${merchantId}/webhooks/${webhookId}`,
      payload,
    );
    return response.data.data;
  }

  static async deleteWebhook(
    merchantId: string,
    webhookId: string,
  ): Promise<void> {
    await axiosClient.delete(`/merchants/${merchantId}/webhooks/${webhookId}`);
  }
}
