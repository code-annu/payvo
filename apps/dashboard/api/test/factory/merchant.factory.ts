import { client } from "@payvo/database/client";
import {
	Merchant,
	MerchantCreateInput,
	MerchantUpdateInput,
} from "@payvo/database/types";

export default abstract class MerchantFactory {
	static async create(data: MerchantCreateInput): Promise<Merchant> {
		return client.orm.public.Merchant.create(data);
	}

	static async get(id: string): Promise<Merchant | null> {
		return client.orm.public.Merchant.first({ id });
	}

	static async update(
		id: string,
		data: MerchantUpdateInput,
	): Promise<Merchant | null> {
		return client.orm.public.Merchant.where({ id }).update(data);
	}

	static async delete(id: string): Promise<void> {
		await client.orm.public.Merchant.where({ id }).deleteAll();
	}
}