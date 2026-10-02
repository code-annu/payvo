import { client } from "@payvo/database/client";
import {
	RefreshToken as DbRefreshToken,
	RefreshTokenCreateInput,
	RefreshTokenUpdateInput,
} from "@payvo/database/types";

export default abstract class RefreshTokenFactory {
	static async create(
		data: RefreshTokenCreateInput,
	): Promise<DbRefreshToken> {
		return client.orm.public.RefreshToken.create(data);
	}

	static async get(id: string): Promise<DbRefreshToken | null> {
		return client.orm.public.RefreshToken.first({ id });
	}

	static async update(
		id: string,
		data: RefreshTokenUpdateInput,
	): Promise<DbRefreshToken | null> {
		return client.orm.public.RefreshToken.where({ id }).update(data);
	}

	static async delete(id: string): Promise<void> {
		await client.orm.public.RefreshToken.where({ id }).deleteAll();
	}
}
