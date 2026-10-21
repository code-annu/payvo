import { prisma, TransactionClient } from "@payvo/database/client";
import {
  UserSession,
  UserSessionUncheckedCreateInput,
} from "@payvo/database/types";
import { injectable } from "inversify";

@injectable()
export default class SessionRepository {
  private readonly db = prisma;

  async create(data: UserSessionUncheckedCreateInput): Promise<UserSession> {
    return await this.db.userSession.create({ data });
  }

  async extendExpiryDate(
    tx: TransactionClient,
    data: { id: string; expiresAt: Date; now: Date },
  ): Promise<UserSession> {
    return await tx.userSession.update({
      where: {
        id: data.id,
        revokedAt: null,
        expiresAt: { gt: data.now },
      },
      data: { expiresAt: data.expiresAt },
    });
  }

  async revokeById(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<void> {
    await tx.userSession.updateMany({
      where: { id: data.id, revokedAt: null },
      data: { revokedAt: data.now },
    });
  }

  async revokeAllByUserId(
    tx: TransactionClient,
    data: { userId: string; now: Date },
  ): Promise<void> {
    await tx.userSession.updateMany({
      where: { userId: data.userId, revokedAt: null },
      data: { revokedAt: data.now },
    });
  }
}
