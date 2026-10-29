import { prisma } from "@payvo/database/client";
import type { UserCreateInput, UserUpdateInput } from "@payvo/database/types";
import { hashPassword } from "@payvo/shared/crypto";
import { randomUUID } from "node:crypto";

export default abstract class UserFactory {
  static async create(data: Partial<UserCreateInput> = {}) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email ?? `test-${randomUUID()}@example.com`,
        passwordHash:
          data.passwordHash ?? (await hashPassword("TestPassword1!")),
      },
    });
  }

  static async createUser(data: Partial<UserCreateInput> = {}) {
    return this.create(data);
  }

  static async find(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email } });
  }

  static async update(id: string, data: UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
