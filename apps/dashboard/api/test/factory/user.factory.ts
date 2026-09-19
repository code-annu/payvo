import { randomUUID } from "node:crypto";
import { hashPassword } from "@payvo/shared/crypto";
import { client } from "@payvo/database/client";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullname: string;
  companyName: string;
}

export type TestUserInput = Omit<TestUser, "id">;

export default abstract class UserFactory {
  static buildUser(overrides: Partial<TestUserInput> = {}): TestUserInput {
    return {
      email: `auth-${randomUUID()}@example.com`,
      password: "Password123!",
      fullname: "Integration User",
      companyName: "Integration Company",
      ...overrides,
    };
  }

  static async createUser(
    overrides: Partial<TestUserInput> = {},
  ): Promise<TestUser> {
    const user = this.buildUser(overrides);
    const passwordHash = await hashPassword(user.password);
    const record = await client.orm.public.User.create({
      email: user.email,
      passwordHash,
      fullname: user.fullname,
      companyName: user.companyName,
    });

    return { ...user, id: record.id };
  }
}
