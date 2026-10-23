import { prisma } from "@payvo/database/client";
import type {
  UserSessionUncheckedCreateInput,
  UserSessionUpdateInput,
} from "@payvo/database/types";

export default abstract class SessionFactory {
  static async create(data: UserSessionUncheckedCreateInput) {
    return prisma.userSession.create({ data });
  }

  static async find(id: string) {
    return prisma.userSession.findUnique({ where: { id } });
  }

  static async findByUserId(userId: string) {
    return prisma.userSession.findMany({ where: { userId } });
  }

  static async update(id: string, data: UserSessionUpdateInput) {
    return prisma.userSession.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.userSession.delete({ where: { id } });
  }
}
