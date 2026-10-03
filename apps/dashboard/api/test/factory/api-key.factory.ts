import { client } from "@payvo/database/client";
import {
	ApiKey,
	ApiKeyCreateInput,
	ApiKeyUpdateInput,
} from "@payvo/database/types";

export default abstract class ApiKeyFactory {
	static async create(data: ApiKeyCreateInput): Promise<ApiKey> {
		return client.orm.public.ApiKey.create(data);
	}

	static async get(id: string): Promise<ApiKey | null> {
		return client.orm.public.ApiKey.first({ id });
	}

	static async getByKeyId(keyId: string): Promise<ApiKey | null> {
		return client.orm.public.ApiKey.first({ keyId });
	}

	static async update(
		id: string,
		data: ApiKeyUpdateInput,
	): Promise<ApiKey | null> {
		return client.orm.public.ApiKey.where({ id }).update(data);
	}

	static async delete(id: string): Promise<void> {
		await client.orm.public.ApiKey.where({ id }).deleteAll();
	}
}