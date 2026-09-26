import { client } from "@payvo/database/client";
import type { MerchantCreateInput } from "@payvo/database/types";

interface MerchantRecord {
	id: string;
}

export default abstract class MerchantFactory {
	private static db = client;

	static async createMerchant(
		userId: string,
		overrides: Partial<MerchantCreateInput> = {},
	): Promise<MerchantRecord> {
		return this.db.orm.public.Merchant.create({
			userId,
			mid: `mid_${crypto.randomUUID()}`,
			...overrides,
		});
	}
}
