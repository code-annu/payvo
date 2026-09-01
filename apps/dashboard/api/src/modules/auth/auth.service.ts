import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import SessionRepository from "./repository/session.repository.js";
import UserRepository from "../user/repository/user.repository.js";
import { SignupDto } from "./dto/SignupDto.js";
import {
  EmailAlreadyExistsError,
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedSessionError,
} from "./error/auth.errors.js";
import { jwtConfig } from "@payvo/config";
import { LoginDto } from "./dto/LoginDto.js";
import { hashPassword, verifyPassword } from "@payvo/shared/crypto";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/auth/refresh-token";
import { addDays } from "date-fns";
import { signAccessToken } from "@payvo/shared/auth/jwt";

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async signup(input: SignupDto) {
    const emailExistingUser = await this.userRepo.findUserByEmail(input.email);
    if (emailExistingUser) {
      throw new EmailAlreadyExistsError(
        `User with email ${input.email} already exists`,
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepo.createUser({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      companyName: input.companyName || null,
    });
    const token = generateRefreshToken();

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      tokenHash: hashRefreshToken(token),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: addDays(
        new Date(),
        jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
      ).toISOString(),
    });

    const accessToken = await signAccessToken(
      { sid: session.id, sub: user.id },
      {
        secret: jwtConfig.ACCESS_TOKEN.SECRET,
        expiresInMinute: jwtConfig.ACCESS_TOKEN.EXPIRY_MINUTE,
      },
    );
    return { user, session, refreshToken: token, accessToken };
  }

  async login(input: LoginDto) {
    const user = await this.userRepo.findUserByEmail(input.email);
    if (
      !user ||
      !(await verifyPassword(input.password, user.passwordHash)) ||
      user.deletedAt
    ) {
      throw new InvalidCredentialsError("Invalid email or password");
    }
    const refreshToken = generateRefreshToken();

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: addDays(
        new Date(),
        jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
      ).toISOString(),
    });
    const accessToken = await signAccessToken(
      { sid: session.id, sub: user.id },
      {
        secret: jwtConfig.ACCESS_TOKEN.SECRET,
        expiresInMinute: jwtConfig.ACCESS_TOKEN.EXPIRY_MINUTE,
      },
    );
    return { user, refreshToken, accessToken };
  }

  async rotateToken(refreshToken: string) {
    const session = await this.sessionRepo.findSessionByTokenHash(
      hashRefreshToken(refreshToken),
    );
    if (!session) throw new InvalidRefreshTokenError();
    if (session.expiresAt <= new Date()) throw new ExpiredSessionError();
    if (session.revokedAt) throw new RevokedSessionError();

    if (session.user.deletedAt) {
      throw new InvalidCredentialsError("Invalid refresh token");
    }
    const newRefreshToken = generateRefreshToken();

    await this.sessionRepo.updateSession(session.id, {
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: addDays(
        new Date(),
        jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
      ).toISOString(),
    });
    const newAccessToken = await signAccessToken(
      { sid: session.id, sub: session.user.id },
      {
        secret: jwtConfig.ACCESS_TOKEN.SECRET,
        expiresInMinute: jwtConfig.ACCESS_TOKEN.EXPIRY_MINUTE,
      },
    );
    return { newRefreshToken, newAccessToken };
  }

  async logout(sessionId: string) {
    await this.sessionRepo.revokeSession(sessionId);
  }

  async logoutAll(userId: string) {
    await this.sessionRepo.revokeSessionByUserId(userId);
  }
}
