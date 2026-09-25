import { injectable, inject } from "inversify";
import { SignupDto } from "../dto/SignupDto.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import { hashPassword } from "@payvo/shared/crypto";
import { jwtConfig, sessionConfig } from "@payvo/config/auth";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import SessionRepository from "../../repository/session.repository.js";
import RefreshTokenRepository from "../../repository/refresh-token.repository.js";
import { EmailAlreadyExists } from "../../error/auth.errors.js";
import { addDays } from "date-fns";

@injectable()
export default class SignupUsecase {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: SignupDto) {
    const existingUser = await this.userRepository.findByEmailIncludingDeleted(
      input.email,
    );

    if (existingUser) {
      throw new EmailAlreadyExists(
        "This email is already associated with an account",
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      fullname: input.fullname,
      companyName: input.companyName ?? null,
    });

    const expiresAt = addDays(new Date(), sessionConfig.sessionExpiryDays);

    const session = await this.sessionRepository.create({
      userId: user.id,
      userAgent: input.client.userAgent,
      ipAddress: input.client.ipAddress,
      expiresAt: expiresAt.toISOString(),
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await this.refreshTokenRepository.create({
      sessionId: session.id,
      tokenHash,
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
      refreshToken: rawRefreshToken,
    };
  }
}
