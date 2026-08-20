import { prisma } from "@/core/prisma/prisma.client";
import { injectable } from "inversify";
import { User } from "../entity/user.entity";
import { Prisma } from "@/generated/prisma";

@injectable()
export default class UserRepository {
  private readonly db = prisma;

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string) {
    await this.db.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }
}
