import { client } from "@payvo/database/client";
import {
	User as DbUser,
	UserCreateInput,
	UserUpdateInput,
} from "@payvo/database/types";

export default abstract class UserFactory {
	static async create(data: UserCreateInput): Promise<DbUser> {
		return client.orm.public.User.create(data);
	}

	static async get(id: string): Promise<DbUser | null> {
		return client.orm.public.User.first({ id });
	}

	static async getByEmail(email: string): Promise<DbUser | null> {
		return client.orm.public.User.first({ email });
	}

	static async update(
		id: string,
		data: UserUpdateInput,
	): Promise<DbUser | null> {
		return client.orm.public.User.where({ id }).update(data);
	}

	static async delete(id: string): Promise<void> {
		await client.orm.public.User.where({ id }).deleteAll();
	}
}
