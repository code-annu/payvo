import { prisma } from "@/core/prisma/prisma.client";
import { injectable } from "inversify";
import { RefreshToken } from "../entity/refresh-token.entity";
import { Prisma } from "@/generated/prisma";

@injectable()
export default class RefreshTokenRepository {
  private readonly db = prisma;

  async create(
    data: Prisma.RefreshTokenUncheckedCreateInput,
  ): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data,
      include: { session: { include: { user: true } } },
    });
  }

  async update(id: string, data: Prisma.RefreshTokenUpdateInput) {
    return this.db.refreshToken.update({
      where: { id },
      data,
      include: { session: { include: { user: true } } },
    });
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({
      where: { id },
      include: { session: { include: { user: true } } },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: { include: { user: true } } },
    });
  }

  async revoke(id: string) {
    return this.db.refreshToken.updateMany({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeBySessionId(sessionId: string) {
    return this.db.refreshToken.updateMany({
      where: { sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByUserId(userId: string) {
    return this.db.refreshToken.updateMany({
      where: {
        session: { userId, revokedAt: null },
      },
      data: { revokedAt: new Date() },
    });
  }
}
