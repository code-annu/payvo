import type { Session as PrismaSession } from "@payvo/database/types";
import type { RefreshToken as PrismaRefreshToken } from "@payvo/database/types";
import { injectable } from "inversify";
import type { Session } from "./entity/session.entity.js";
import type { RefreshToken } from "./entity/refresh-token.entity.js";
import { RefreshTokenRotation } from "./entity/refresh-token-rotation.entity.js";

type PrismaRefreshTokenWithRelation = PrismaRefreshToken & {
  session: {
    id: string;
    expiresAt: string;
    revokedAt: string | null;
    user: {
      id: string;
      deletedAt: string | null;
    };
  };
};

@injectable()
export default class AuthMapper {
  toSessionEntity(session: PrismaSession): Session {
    return {
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
      expiresAt: new Date(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  }

  toRefreshTokenEntity(refreshToken: PrismaRefreshToken): RefreshToken {
    return {
      id: refreshToken.id,
      sessionId: refreshToken.sessionId,
      tokenHash: refreshToken.tokenHash,
      revokedAt: refreshToken.revokedAt
        ? new Date(refreshToken.revokedAt)
        : null,
      createdAt: new Date(refreshToken.createdAt),
      updatedAt: new Date(refreshToken.updatedAt),
    };
  }

  toRefreshTokenRotationEntity(
    refreshToken: PrismaRefreshTokenWithRelation,
  ): RefreshTokenRotation {
    return {
      id: refreshToken.id,
      tokenHash: refreshToken.tokenHash,
      revokedAt: refreshToken.revokedAt
        ? new Date(refreshToken.revokedAt)
        : null,
      session: {
        id: refreshToken.session.id,
        expiresAt: new Date(refreshToken.session.expiresAt),
        revokedAt: refreshToken.session.revokedAt
          ? new Date(refreshToken.session.revokedAt)
          : null,
        user: {
          id: refreshToken.session.user.id,
          deletedAt: refreshToken.session.user.deletedAt
            ? new Date(refreshToken.session.user.deletedAt)
            : null,
        },
      },
    };
  }
}
