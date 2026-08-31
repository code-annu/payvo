import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import SessionRepository from "./repository/session.repository.js";
import UserRepository from "../user/repository/user.repository.js";
import { SignupDto } from "./dto/SignupDto.js";
import { JWTService } from "@payvo/shared/jwt";
import { PasswordHashService } from "@payvo/shared/password-hash";
import {
  EmailAlreadyExistsError,
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedSessionError,
} from "./error/auth.errors.js";
import { jwtConfig } from "@payvo/config";
import { LoginDto } from "./dto/LoginDto.js";

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.JWTService) private readonly jwtService: JWTService,
    @inject(TYPES.PasswordHashService)
    private readonly passwordHashService: PasswordHashService,
  ) {}

  async signup(input: SignupDto) {
    const emailExistingUser = await this.userRepo.findUserByEmail(input.email);
    if (emailExistingUser) {
      throw new EmailAlreadyExistsError(
        `User with email ${input.email} already exists`,
      );
    }

    const passwordHash = await this.passwordHashService.hashPassword(
      input.password,
    );
    const user = await this.userRepo.createUser({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      companyName: input.companyName || null,
    });
    const refreshToken = this.jwtService.generateRefreshToken({
      expiresInDays: jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
    });

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      tokenHash: this.jwtService.hashToken(refreshToken.token),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: refreshToken.expiresAt.toISOString(),
    });

    const accessToken = this.jwtService.generateAccessToken(
      { sid: session.id, sub: user.id },
      {
        secret: jwtConfig.ACCESS_TOKEN.SECRET,
        expiresInMinute: jwtConfig.ACCESS_TOKEN.EXPIRY_MINUTE,
      },
    );
    return { user, session, refreshToken, accessToken };
  }

  async login(input: LoginDto) {
    const user = await this.userRepo.findUserByEmail(input.email);
    if (
      !user ||
      !(await this.passwordHashService.comparePassword(
        input.password,
        user.passwordHash,
      )) ||
      user.deletedAt
    ) {
      throw new InvalidCredentialsError("Invalid email or password");
    }
    const refreshToken = this.jwtService.generateRefreshToken({
      expiresInDays: jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
    });
    const session = await this.sessionRepo.createSession({
      userId: user.id,
      tokenHash: this.jwtService.hashToken(refreshToken.token),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: refreshToken.expiresAt.toISOString(),
    });
    const accessToken = this.jwtService.generateAccessToken(
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
      this.jwtService.hashToken(refreshToken),
    );
    if (!session) throw new InvalidRefreshTokenError();
    if (session.expiresAt <= new Date()) throw new ExpiredSessionError();
    if (session.revokedAt) throw new RevokedSessionError();

    if (session.user.deletedAt) {
      throw new InvalidCredentialsError("Invalid refresh token");
    }
    const newRefreshToken = this.jwtService.generateRefreshToken({
      expiresInDays: jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS,
    });

    await this.sessionRepo.updateSession(session.id, {
      tokenHash: this.jwtService.hashToken(newRefreshToken.token),
      expiresAt: newRefreshToken.expiresAt.toISOString(),
    });
    const newAccessToken = this.jwtService.generateAccessToken(
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
