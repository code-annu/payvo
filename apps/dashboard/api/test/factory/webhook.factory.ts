import { client } from "@payvo/database/client";
import {
	Webhook,
	WebhookCreateInput,
	WebhookUpdateInput,
} from "@payvo/database/types";

export default abstract class WebhookFactory {
	static async create(data: WebhookCreateInput): Promise<Webhook> {
		return client.orm.public.Webhook.create(data);
	}

	static async get(id: string): Promise<Webhook | null> {
		return client.orm.public.Webhook.first({ id });
	}

	static async getByMerchantId(merchantId: string): Promise<Webhook[]> {
		return client.orm.public.Webhook.where({ merchantId }).all();
	}

	static async update(
		id: string,
		data: WebhookUpdateInput,
	): Promise<Webhook | null> {
		return client.orm.public.Webhook.where({ id }).update(data);
	}

	static async delete(id: string): Promise<void> {
		await client.orm.public.Webhook.where({ id }).deleteAll();
	}
}
