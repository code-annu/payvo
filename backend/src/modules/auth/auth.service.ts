import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types";
import UserRepository from "../user/repository/user.repository";
import {
  EmailAlreadyExistsError,
  ExpiredRefreshTokenError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  SessionExpiredError,
  SessionRevokedError,
} from "./auth.errors";
import bcrypt from "bcrypt";
import SessionRepository from "./repository/session.repository";
import RefreshTokenRepository from "./repository/refresh-token.repository";
import ENV from "@/core/config/env";
import { addDays } from "date-fns";
import JWTUtil from "@/shared/util/jwt.util";
import { SignupDto } from "./dto/SignupDto";
import { LoginDto } from "./dto/LoginDto";

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.SessionRepository)
    private readonly sessionRepo: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @inject(TYPES.JWTUtil) private readonly jwtUtil: JWTUtil,
  ) {}

  async signup(input: SignupDto) {
    const { email, password, fullname, companyName, client } = input;
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(`Email ${email} already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepo.create({
      email,
      passwordHash,
      fullname,
      companyName: companyName ?? null,
    });

    const session = await this.sessionRepo.create({
      userId: user.id,
      expiresAt: addDays(new Date(), ENV.SESSION_EXPIRY_DAYS),
      userAgent: client.userAgent,
      ipAddress: client.ipAddress,
    });
    const refreshTokenStr = this.jwtUtil.generateRefreshToken();

    await this.refreshTokenRepo.create({
      tokenHash: this.jwtUtil.hashToken(refreshTokenStr),
      sessionId: session.id,
      expiresAt: this.jwtUtil.generateRefreshTokenExpiry(),
    });

    const accessToken = this.jwtUtil.generateAccessToken({
      sub: user.id,
      sid: session.id,
    });

    return { user, session: { accessToken, refreshToken: refreshTokenStr } };
  }

  async login(input: LoginDto) {
    const { email, password, client } = input;
    const user = await this.userRepo.findByEmail(email);
    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash)) ||
      user.deletedAt
    ) {
      throw new InvalidCredentialsError("Invalid email or passwords");
    }

    const session = await this.sessionRepo.create({
      userId: user.id,
      expiresAt: addDays(new Date(), ENV.SESSION_EXPIRY_DAYS),
      userAgent: client.userAgent,
      ipAddress: client.ipAddress,
    });
    const refreshTokenStr = this.jwtUtil.generateRefreshToken();

    await this.refreshTokenRepo.create({
      tokenHash: this.jwtUtil.hashToken(refreshTokenStr),
      sessionId: session.id,
      expiresAt: this.jwtUtil.generateRefreshTokenExpiry(),
    });

    const accessToken = this.jwtUtil.generateAccessToken({
      sub: user.id,
      sid: session.id,
    });

    return { user, session: { accessToken, refreshToken: refreshTokenStr } };
  }

  async refreshToken(token: string) {
    const refreshToken = await this.refreshTokenRepo.findByTokenHash(
      this.jwtUtil.hashToken(token),
    );

    if (!refreshToken) {
      throw new InvalidRefreshTokenError("Invalid refresh token");
    }
    if (refreshToken.expiresAt <= new Date()) {
      throw new ExpiredRefreshTokenError("Refresh token is expired");
    }
    if (refreshToken.revokedAt) {
      throw new RevokedRefreshTokenError("Refresh token is revoked");
    }
    if (refreshToken.session.expiresAt <= new Date()) {
      throw new SessionExpiredError("Session has expired");
    }
    if (refreshToken.session.revokedAt) {
      throw new SessionRevokedError("Session has been revoked");
    }
    if (refreshToken.session.user.deletedAt) {
      throw new InvalidCredentialsError("Invalid credentials ");
    }

    const refreshTokenStr = this.jwtUtil.generateRefreshToken();
    await this.refreshTokenRepo.update(refreshToken.id, {
      tokenHash: this.jwtUtil.hashToken(refreshTokenStr),
      expiresAt: this.jwtUtil.generateRefreshTokenExpiry(),
    });

    const accessToken = this.jwtUtil.generateAccessToken({
      sub: refreshToken.session.user.id,
      sid: refreshToken.session.id,
    });

    return {
      session: { accessToken, refreshToken: refreshTokenStr },
    };
  }

  async logout(sessionId: string) {
    await this.sessionRepo.revoke(sessionId);
    await this.refreshTokenRepo.revokeBySessionId(sessionId);
  }

  async logoutAll(userId: string) {
    await this.sessionRepo.revokeAllByUserId(userId);
    await this.refreshTokenRepo.revokeByUserId(userId);
  }
}
