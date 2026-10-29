import { prisma } from "@payvo/database/client";
import type {
  RefreshTokenUncheckedCreateInput,
  RefreshTokenUpdateInput,
} from "@payvo/database/types";

export default abstract class RefreshTokenFactory {
  static async create(data: RefreshTokenUncheckedCreateInput) {
    return prisma.refreshToken.create({ data });
  }

  static async find(id: string) {
    return prisma.refreshToken.findUnique({ where: { id } });
  }

  static async findBySessionId(sessionId: string) {
    return prisma.refreshToken.findMany({ where: { sessionId } });
  }

  static async update(id: string, data: RefreshTokenUpdateInput) {
    return prisma.refreshToken.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  }
}
