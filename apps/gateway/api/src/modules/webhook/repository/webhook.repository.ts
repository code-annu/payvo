import { inject, injectable } from "inversify";
import { client } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import WebhookMapper from "../webhook.mapper.js";
import type { Webhook } from "../entity/webhook.entity.js";

@injectable()
export default class WebhookRepository {
  constructor(
    @inject(TYPES.WebhookMapper)
    private readonly mapper: WebhookMapper,
  ) {}

  async findByMerchantId(merchantId: string): Promise<Webhook[]> {
    const webhooks = await client.orm.public.Webhook.where({
      merchantId,
    }).all();
    return webhooks.map((webhook) => this.mapper.toWebhookEntity(webhook));
  }
}
