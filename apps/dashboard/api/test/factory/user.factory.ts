import { client } from "@payvo/database/client";
import type { User } from "@payvo/database/types";
import { hashPassword } from "@payvo/shared/crypto";

export interface UserOverrides {
  email?: string;
  password?: string;
  fullname?: string;
  companyName?: string | null;
  deletedAt?: string | null;
}

export interface CreateUserResult {
  user: User;
  plainPassword: string;
}

let userCounter = 0;

export abstract class UserFactory {
  static async createUser(
    overrides: UserOverrides = {},
  ): Promise<CreateUserResult> {
    userCounter++;
    const plainPassword = overrides.password ?? "Test@1234";
    const passwordHash = await hashPassword(plainPassword);

    const user = await client.orm.public.User.create({
      email: overrides.email ?? `testuser-${userCounter}-${Date.now()}@test.com`,
      passwordHash,
      fullname: overrides.fullname ?? "Test User",
      companyName: overrides.companyName ?? null,
    });

    // Handle optional field updates that aren't part of create
    if (overrides.deletedAt !== undefined) {
      const updated = await client.orm.public.User.where({ id: user.id }).update({
        deletedAt: overrides.deletedAt,
      });
      if (!updated) throw new Error("Failed to update user deletedAt");
      return { user: updated, plainPassword };
    }

    return { user, plainPassword };
  }

  static async findUser(
    where: Parameters<typeof client.orm.public.User.first>[0],
  ): Promise<User | null> {
    return client.orm.public.User.first(where);
  }

  static async findUserById(id: string): Promise<User | null> {
    return client.orm.public.User.first({ id });
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return client.orm.public.User.first({ email });
  }
}
