import { injectable, inject } from "inversify";
import AuthMapper from "../auth.mapper.js";
import TYPES from "@/core/di/inversify.types.js";
import { client, TransactionClient } from "@payvo/database/client";
import { RefreshTokenCreateInput } from "@payvo/database/types";
import { RefreshToken } from "../entity/refresh-token.entity.js";
import { RefreshTokenRotation } from "../entity/refresh-token-rotation.entity.js";

@injectable()
export default class RefreshTokenRepository {
  private readonly db = client;
  constructor(@inject(TYPES.AuthMapper) private readonly mapper: AuthMapper) {}

  async create(
    data: RefreshTokenCreateInput,
    tx?: TransactionClient,
  ): Promise<RefreshToken> {
    const refreshToken = await (tx ?? this.db).orm.public.RefreshToken.create(
      data,
    );
    return this.mapper.toRefreshTokenEntity(refreshToken);
  }

  async findForRotation(
    tx: TransactionClient,
    tokenHash: string,
  ): Promise<RefreshTokenRotation | null> {
    const refreshToken = await tx.orm.public.RefreshToken.where({
      tokenHash,
    })
      .include("session", (session) =>
        session
          .select("id", "expiresAt", "revokedAt")
          .include("user", (user) => user.select("id", "deletedAt")),
      )
      .first();

    return refreshToken
      ? this.mapper.toRefreshTokenRotationEntity(refreshToken)
      : null;
  }

  async revoke(
    tx: TransactionClient,
    data: { id: string; now: Date },
  ): Promise<RefreshToken | null> {
    const refreshToken = await tx.orm.public.RefreshToken.where({
      id: data.id,
      revokedAt: null,
    }).update({ revokedAt: data.now.toISOString() });

    return refreshToken ? this.mapper.toRefreshTokenEntity(refreshToken) : null;
  }

  async revokeForLogout(
    tx: TransactionClient,
    data: { sessionId: string; now: Date },
  ): Promise<void> {
    await tx.orm.public.RefreshToken.where({
      sessionId: data.sessionId,
      revokedAt: null,
    }).update({ revokedAt: data.now.toISOString() });
  }
}
