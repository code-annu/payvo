import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "../user/repository/user.repository.js";
import SessionRepository from "./repository/session.repository.js";
import RefreshTokenRepository from "./repository/refresh-token.repository.js";
import { SignupDto } from "./dto/SignupDto.js";
import * as authErrors from "./error/auth.errors.js";
import { hashPassword, verifyPassword } from "@payvo/shared/crypto";
import { jwtConfig, sessionConfig } from "@payvo/config/auth";
import { addDays } from "date-fns";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import { LoginDto } from "./dto/LoginDto.js";
import { dbTransaction } from "@payvo/database/client";

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async signup(input: SignupDto) {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new authErrors.EmailAlreadyExists(
        "This email is associated with another account",
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      companyName: input.companyName,
    });

    const client = input.client;
    const session = await this.sessionRepo.create({
      userId: user.id,
      userAgent: client.userAgent,
      ipAddress: client.ipAddress,
      expiresAt: addDays(
        new Date(),
        sessionConfig.sessionExpiryDays,
      ).toISOString(),
    });

    const refreshTokenStr = generateRefreshToken();
    await this.refreshTokenRepo.create({
      sessionId: session.id,
      tokenHash: hashRefreshToken(refreshTokenStr),
    });

    const accessToken = await signAccessToken(
      { sub: user.id, sid: session.id },
      {
        secret: jwtConfig.accessToken.secret,
        expiresInMinute: jwtConfig.accessToken.expiryMinutes,
      },
    );

    return { accessToken, refreshToken: refreshTokenStr, session };
  }

  async login(input: LoginDto) {
    const user = await this.userRepo.findByEmail(input.email);
    if (
      !user ||
      !(await verifyPassword(input.password, user.passwordHash)) ||
      user.deletedAt
    ) {
      throw new authErrors.InvalidCredentialsError("Invalid email or password");
    }

    const client = input.client;
    const session = await this.sessionRepo.create({
      userId: user.id,
      userAgent: client.userAgent,
      ipAddress: client.ipAddress,
      expiresAt: addDays(
        new Date(),
        sessionConfig.sessionExpiryDays,
      ).toISOString(),
    });

    const refreshTokenStr = generateRefreshToken();
    await this.refreshTokenRepo.create({
      sessionId: session.id,
      tokenHash: hashRefreshToken(refreshTokenStr),
    });

    const accessToken = await signAccessToken(
      { sub: user.id, sid: session.id },
      {
        secret: jwtConfig.accessToken.secret,
        expiresInMinute: jwtConfig.accessToken.expiryMinutes,
      },
    );

    return { accessToken, refreshToken: refreshTokenStr, session };
  }

  async rotateToken(token: string) {
    return await dbTransaction(async (tx) => {
      const existingRefreshToken = await this.refreshTokenRepo.findForRotate(
        tx,
        hashRefreshToken(token),
      );
      if (!existingRefreshToken)
        throw new authErrors.InvalidRefreshTokenError();
      if (existingRefreshToken.revokedAt) {
        throw new authErrors.RevokedRefreshTokenError(
          "Revoked token cannot be used for token rotation",
        );
      }
      const session = existingRefreshToken.session;
      const user = session.user;
      if (session.expiresAt <= new Date()) {
        throw new authErrors.ExpiredSessionError(
          "Token belongs to an expired session, please login again",
        );
      }
      if (session.revokedAt) {
        throw new authErrors.SessionRevokedError(
          "Token belongs to a revoked session, please login again",
        );
      }
      if (user.deletedAt) {
        throw new authErrors.InvalidCredentialsError(
          "Token belongs to a deleted user, please login again",
        );
      }

      const refreshTokenStr = generateRefreshToken();
      const newRefreshToken = await this.refreshTokenRepo.create(
        { sessionId: session.id, tokenHash: hashRefreshToken(refreshTokenStr) },
        tx,
      );

      await this.refreshTokenRepo.revoke(tx, {
        tokenId: existingRefreshToken.id,
        revokedBy: newRefreshToken.id,
      });

      const updatedSession = await this.sessionRepo.extendExpiryDate(tx, {
        id: session.id,
        expiresAt: addDays(new Date(), sessionConfig.sessionExpiryDays),
      });

      const accessToken = await signAccessToken(
        { sub: user.id, sid: session.id },
        {
          secret: jwtConfig.accessToken.secret,
          expiresInMinute: jwtConfig.accessToken.expiryMinutes,
        },
      );

      return {
        accessToken,
        refreshToken: refreshTokenStr,
        session: updatedSession!,
      };
    });
  }

  async logout(sessionId: string) {
    await dbTransaction(async (tx) => {
      await this.refreshTokenRepo.revokeForSession(tx, { sessionId });
      await this.sessionRepo.revoke(tx, { id: sessionId });
    });
  }
}
