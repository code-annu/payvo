import { client, TransactionClient } from "@payvo/database/client";
import { injectable } from "inversify";
import { RefreshToken } from "../entity/refresh-token.entity";
import { RefreshTokenCreateInput } from "@payvo/database/types";
import { stringToDate, stringToDateNullable } from "@/core/utils/date.utils";
import { RefreshTokenRotate } from "../entity/refresh-token-rotate.entity";

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

  async findForRotate(
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

  async revoke(
    tx: TransactionClient,
    data: { tokenId: string; revokedBy: string },
  ) {
    const { tokenId, revokedBy } = data;
    await tx.orm.public.RefreshToken.where({ id: tokenId }).update({
      revokedAt: new Date().toISOString(),
      revokedById: revokedBy,
    });
  }

  async revokeForSession(tx: TransactionClient, data: { sessionId: string }) {
    const { sessionId } = data;
    await tx.orm.public.RefreshToken.where({
      sessionId,
      revokedAt: null,
    }).update({
      revokedAt: new Date().toISOString(),
    });
  }
}
