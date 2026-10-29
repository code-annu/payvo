import { prisma, TransactionClient } from "@payvo/database/client";
import {
  RefreshToken,
  RefreshTokenUncheckedCreateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";
// import { RefreshTokenRotation } from "../entity/refresh-token-rotation.entity.js";

@injectable()
export default class RefreshTokenRepository {
  private readonly db = prisma;

  async create(
    data: RefreshTokenUncheckedCreateInput,
    tx?: TransactionClient,
  ): Promise<RefreshToken> {
    return await (tx ?? this.db).refreshToken.create({ data });
  }

  async findForRotation(tx: TransactionClient, tokenHash: string) {
    return await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: {
          select: {
            id: true,
            expiresAt: true,
            revokedAt: true,
            user: { select: { id: true, deletedAt: true } },
          },
        },
      },
    });
  }

  async revokeById(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<RefreshToken> {
    return await tx.refreshToken.update({
      where: { id: data.id, revokedAt: null },
      data: { revokedAt: data.now },
    });
  }

  async revokeAllBySessionId(
    tx: TransactionClient,
    data: { sessionId: string; now: Date },
  ): Promise<void> {
    await tx.refreshToken.updateMany({
      where: { sessionId: data.sessionId, revokedAt: null },
      data: { revokedAt: data.now },
    });
  }

  async revokeAllByUserId(
    tx: TransactionClient,
    data: { userId: string; now: Date },
  ): Promise<void> {
    await tx.refreshToken.updateMany({
      where: { session: { is: { userId: data.userId } }, revokedAt: null },
      data: { revokedAt: data.now },
    });
  }
}
