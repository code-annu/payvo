import { injectable, inject } from "inversify";
import { dbTransaction } from "@payvo/database/client";
import TYPES from "@/core/di/inversify.types.js";
import SessionRepository from "../../repository/session.repository.js";
import RefreshTokenRepository from "../../repository/refresh-token.repository.js";

@injectable()
export default class LogoutUsecase {
  constructor(
    @inject(TYPES.SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @inject(TYPES.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(sessionId: string) {
    const now = new Date();
    await dbTransaction(async (tx) => {
      await this.refreshTokenRepository.revokeForLogout(tx, { sessionId, now });
      await this.sessionRepository.revokeForLogout(tx, { id: sessionId, now });
    });
  }
}
