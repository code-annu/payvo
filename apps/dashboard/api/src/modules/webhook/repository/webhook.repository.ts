import { inject, injectable } from "inversify";
import WebhookMapper from "../webhook.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client } from "@payvo/database/client";
import { WebhookCreateInput, WebhookUpdateInput } from "@payvo/database/types";
import { Webhook } from "../entity/webhook.entity.js";
import { MerchantWebhooks } from "../entity/merchant-webhooks.entity.js";

@injectable()
export default class WebhookRepository {
  private readonly db = client;

  constructor(
    @inject(TYPES.WebhookMapper) private readonly mapper: WebhookMapper,
  ) {}

  async create(data: WebhookCreateInput): Promise<Webhook> {
    const webhook = await this.db.orm.public.Webhook.create(data);
    return this.mapper.toWebhookEntity(webhook);
  }

  async findByMerchantId(merchantId: string): Promise<MerchantWebhooks> {
    const webhooks = await this.db.orm.public.Webhook.where({ merchantId }).all();
    return this.mapper.toMerchantWebhooksEntity(merchantId, webhooks);
  }

  async findById(id: string): Promise<Webhook | null> {
    const webhook = await this.db.orm.public.Webhook.first({ id });
    return webhook ? this.mapper.toWebhookEntity(webhook) : null;
  }

  async update(data: {
    id: string;
    merchantId: string;
    url: string;
  }): Promise<Webhook | null> {
    const update: WebhookUpdateInput = { url: data.url };
    const webhook = await this.db.orm.public.Webhook.where({
      id: data.id,
      merchantId: data.merchantId,
    }).update(update);
    return webhook ? this.mapper.toWebhookEntity(webhook) : null;
  }

  async delete(data: {
    id: string;
    merchantId: string;
  }): Promise<Webhook | null> {
    const webhook = await this.db.orm.public.Webhook.where({
      id: data.id,
      merchantId: data.merchantId,
    }).delete();
    return webhook ? this.mapper.toWebhookEntity(webhook) : null;
  }
}