import { client, TransactionClient } from "@payvo/database/client";
import { injectable } from "inversify";
import { RefreshToken } from "../entity/refresh-token.entity.js";
import { RefreshTokenCreateInput } from "@payvo/database/types";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils.js";
import { RefreshTokenRotate } from "../entity/refresh-token-rotate.entity.js";

@injectable()
export default class RefreshTokenRepository {
  private readonly db = client;

  async create(
    data: RefreshTokenCreateInput,
    tx?: TransactionClient,
  ): Promise<RefreshToken> {
    const refreshToken = await (tx ?? this.db).orm.public.RefreshToken.create(
      data,
    );
    return {
      ...refreshToken,
      revokedAt: stringToDateNullable(refreshToken.revokedAt),
      createdAt: stringToDate(refreshToken.createdAt),
    };
  }

  async findForRotation(
    tx: TransactionClient,
    tokenHash: string,
  ): Promise<RefreshTokenRotate | null> {
    const token = await tx.orm.public.RefreshToken.where({
      tokenHash,
    })
      .include("session", (session) =>
        session
          .select("id", "expiresAt", "revokedAt")
          .include("user", (user) => user.select("id", "deletedAt")),
      )
      .first();

    if (!token) return null;
    const { session, ...rest } = token;
    const { user } = session;

    return {
      id: rest.id,
      revokedAt: stringToDateNullable(rest.revokedAt),
      tokenHash: rest.tokenHash,
      session: {
        id: session.id,
        expiresAt: stringToDate(session.expiresAt),
        revokedAt: stringToDateNullable(session.revokedAt),
        user: {
          id: user.id,
          deletedAt: stringToDateNullable(user.deletedAt),
        },
      },
    };
  }

  async revokeForRotation(
    tx: TransactionClient,
    data: { tokenId: string; revokedBy: string },
  ): Promise<{ revoked: boolean }> {
    const { tokenId, revokedBy } = data;
    const updatedToken = await tx.orm.public.RefreshToken.where({
      id: tokenId,
      revokedAt: null,
      revokedById: null,
    }).update({
      revokedAt: new Date().toISOString(),
      revokedById: revokedBy,
    });

    return { revoked: Boolean(updatedToken) };
  }

  async revokeForLogout(tx: TransactionClient, data: { sessionId: string }) {
    const { sessionId } = data;
    await tx.orm.public.RefreshToken.where({
      sessionId,
      revokedAt: null,
    }).update({
      revokedAt: new Date().toISOString(),
    });
  }
}
