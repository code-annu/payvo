import { injectable, inject } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import { jwtConfig, sessionConfig } from "@payvo/config/auth";
import TYPES from "@/core/di/inversify.types.js";
import SessionRepository from "../../repository/session.repository.js";
import RefreshTokenRepository from "../../repository/refresh-token.repository.js";
import {
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  ExpiredSessionError,
  SessionRevokedError,
  InvalidCredentialsError,
} from "../../error/auth.errors.js";
import { addDays } from "date-fns";

@injectable()
export default class RotateTokenUsecase {
  constructor(
    @inject(TYPES.SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(token: string) {
    return await dbTransaction(async (tx) => {
      const now = new Date();

      const existingRefreshToken =
        await this.refreshTokenRepository.findForRotation(
          tx,
          hashRefreshToken(token),
        );

      if (!existingRefreshToken) {
        throw new InvalidRefreshTokenError();
      }

      if (existingRefreshToken.revokedAt) {
        throw new RevokedRefreshTokenError(
          "Revoked token cannot be used for token rotation",
        );
      }

      const session = existingRefreshToken.session;

      if (session.expiresAt <= now) {
        throw new ExpiredSessionError(
          "Token belongs to an expired session, please login again",
        );
      }

      if (session.revokedAt) {
        throw new SessionRevokedError(
          "Token belongs to a revoked session, please login again",
        );
      }

      if (session.user.deletedAt) {
        throw new InvalidCredentialsError("Token belongs to a deleted user");
      }

      // Revoke old token first
      const revoked = await this.refreshTokenRepository.revoke(tx, {
        id: existingRefreshToken.id,
        now,
      });

      if (!revoked) {
        throw new RevokedRefreshTokenError(
          "Failed to rotate token, as it might have been rotated already",
        );
      }

      // Create new refresh token
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);

      await this.refreshTokenRepository.create(
        { sessionId: session.id, tokenHash },
        tx,
      );

      // Extend session expiry
      const updatedSession = await this.sessionRepository.extendExpiryDate(tx, {
        id: session.id,
        now,
        expiresAt: addDays(new Date(), sessionConfig.sessionExpiryDays),
      });
      if (!updatedSession) {
        throw new SessionRevokedError(
          "Failed to rotate token, as the session might have been rotated or expired",
        );
      }

      const accessToken = await signAccessToken(
        { sub: session.user.id, sid: session.id },
        {
          secret: jwtConfig.accessToken.secret,
          expiresInMinute: jwtConfig.accessToken.expiryMinutes,
        },
      );

      return {
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }
}
