import { client } from "@payvo/database/client";
import type { User, UserCreateInput } from "@payvo/database/types";

export default abstract class UserFactory {
  private static db = client;

  static async createUser(
    overrides: Partial<UserCreateInput> = {},
  ): Promise<User> {
    return this.db.orm.public.User.create({
      email: `${crypto.randomUUID()}@test.payvo.dev`,
      passwordHash: "password-hash",
      fullname: "Integration Test User",
      ...overrides,
    });
  }
}
