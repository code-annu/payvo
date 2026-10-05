import TYPES from "@/core/di/inversify.types.js";
import WebhookRepository from "@/modules/webhook/repository/webhook.repository.js";
import { inject, injectable } from "inversify";
import { generateSignature } from "@payvo/shared/crypto";
import axios, { AxiosError } from "axios";
import { WebhookPayload } from "./webhook.payload.js";

@injectable()
export default class WebhookWorker {
  constructor(
    @inject(TYPES.WebhookRepository)
    private readonly webhookRepo: WebhookRepository,
  ) {}

  async sendPaymentWebhook(merchantId: string, payload: WebhookPayload) {
    const webhooks = await this.webhookRepo.findByMerchantId(merchantId);
    for (const webhook of webhooks) {
      const url = webhook.url;
      const signature = generateSignature({
        secret: webhook.secretKey,
        payload: JSON.stringify(payload),
      });

      try {
        const result = await axios.post(url, payload, {
          headers: { "x-webhook-signature": signature },
        });
        console.log("Webhook Result is: ", result.data);
      } catch (error) {
        const err = error as AxiosError;
        console.log("Webhook Error is: ", err.response?.data);
      }
    }
  }
}
