import type { Webhook as PrismaWebhook } from "@payvo/database/types";
import { injectable } from "inversify";
import type { Webhook } from "./entity/webhook.entity.js";

@injectable()
export default class WebhookMapper {
  toWebhookEntity(webhook: PrismaWebhook): Webhook {
    return {
      id: webhook.id,
      merchantId: webhook.merchantId,
      secretKey: webhook.secretKey,
      url: webhook.url,
      createdAt: new Date(webhook.createdAt),
      updatedAt: new Date(webhook.updatedAt),
    };
  }
}
