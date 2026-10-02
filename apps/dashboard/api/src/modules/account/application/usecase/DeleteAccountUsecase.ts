import { inject, injectable } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import SessionRepository from "@/modules/auth/repository/session.repository.js";
import RefreshTokenRepository from "@/modules/auth/repository/refresh-token.repository.js";
import ApiKeyRepository from "@/modules/api-key/repository/api-key.repository.js";
import { AccountNotFoundError } from "../../error/account.errors.js";

@injectable()
export default class DeleteAccountUsecase {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TYPES.ApiKeyRepository)
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async execute(userId: string) {
    return await dbTransaction(async (tx) => {
      const now = new Date();

      await this.refreshTokenRepository.revokeAllByUserId(tx, {
        userId,
        now,
      });

      await this.sessionRepository.revokeAllByUserId(tx, { userId, now });

      await this.apiKeyRepository.revokeAllByUserId(tx, { userId, now });

      const user = await this.userRepository.softDelete(userId, tx);

      if (!user) {
        throw new AccountNotFoundError();
      }

      return user;
    });
  }
}
