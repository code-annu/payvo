import { inject, injectable } from "inversify";
import { AuthOutput } from "./dto/auth.dto.js";
import { LoginInput, SignupInput } from "../schema/auth.schema.js";
import * as authErrors from "../error/auth.errors.js";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import { hashPassword, verifyPassword } from "@payvo/shared/crypto";
import RefreshTokenRepository from "../repository/refresh-token.repository.js";
import SessionRepository from "../repository/session.repository.js";
import { dbTransaction, TransactionClient } from "@payvo/database/client";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import { jwtConfig, sessionConfig } from "@payvo/config/auth";
import { addDays, addMinutes } from "date-fns";
import { AuthContract } from "../contract/auth.contract.js";

@injectable()
export default class AuthService implements AuthContract {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async signup(input: SignupInput): Promise<AuthOutput> {
    const { client, email, password } = input;
    const existingUser = await this.userRepo.findByEmailIncludeDeleted(email);

    if (existingUser) {
      throw new authErrors.EmailAlreadyExistsError(
        "This email is already associated with an account",
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await this.userRepo.create({ email, passwordHash });

    return await this.createSessionAndIssueTokens(user.id, client);
  }

  async login(input: LoginInput): Promise<AuthOutput> {
    const { client, email, password } = input;
    const user = await this.userRepo.findByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new authErrors.InvalidCredentialsError("Invalid email or password");
    }

    return await this.createSessionAndIssueTokens(user.id, client);
  }

  async rotateToken(token: string): Promise<AuthOutput> {
    return await dbTransaction(async (tx) => {
      const now = new Date();

      const existingRefreshToken = await this.refreshTokenRepo.findForRotation(
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

      if (session.expiresAt <= now) {
        throw new authErrors.ExpiredSessionError(
          "Token belongs to an expired session, please login again",
        );
      }

      if (session.revokedAt) {
        throw new authErrors.SessionRevokedError(
          "Token belongs to a revoked session, please login again",
        );
      }

      if (session.user.deletedAt) {
        throw new authErrors.InvalidCredentialsError(
          "Token belongs to deleted user",
        );
      }

      await this.refreshTokenRepo.revokeById(tx, {
        id: existingRefreshToken.id,
        now,
      });

      await this.sessionRepo.extendExpiryDate(tx, {
        id: session.id,
        now,
        expiresAt: addDays(new Date(), sessionConfig.sessionExpiryDays),
      });

      return await this.issueTokens(session.user.id, session.id, tx);
    });
  }

  async logout(sessionId: string): Promise<void> {
    const now = new Date();
    await dbTransaction(async (tx) => {
      await this.refreshTokenRepo.revokeAllBySessionId(tx, {
        sessionId,
        now,
      });
      await this.sessionRepo.revokeById(tx, { id: sessionId, now });
    });
  }

  /**
   * Helper to create a user session and issue access/refresh token pair.
   */
  private async createSessionAndIssueTokens(
    userId: string,
    client: { userAgent: string | null; ipAddress: string | null },
  ): Promise<AuthOutput> {
    const expiresAt = addDays(new Date(), sessionConfig.sessionExpiryDays);

    const session = await this.sessionRepo.create({
      ...client,
      userId,
      expiresAt,
    });

    return await this.issueTokens(userId, session.id);
  }

  /**
   * Helper to issue a new refresh token and signed JWT access token.
   */
  private async issueTokens(
    userId: string,
    sessionId: string,
    tx?: TransactionClient,
  ) {
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await this.refreshTokenRepo.create({ sessionId, tokenHash }, tx);

    const accessTokenExpiresAt = addMinutes(
      new Date(),
      jwtConfig.accessToken.expiryMinutes,
    );
    const accessToken = await signAccessToken(
      { sub: userId, sid: sessionId },
      { secret: jwtConfig.accessToken.secret, expiresAt: accessTokenExpiresAt },
    );

    return {
      accessToken: { token: accessToken, expiresAt: accessTokenExpiresAt },
      refreshToken: rawRefreshToken,
    };
  }

  async revokeSessionsAndTokens(
    tx: TransactionClient,
    data: { userId: string; now: Date },
  ): Promise<void> {
    await this.sessionRepo.revokeAllByUserId(tx, data);
    await this.refreshTokenRepo.revokeAllByUserId(tx, data);
  }
}
