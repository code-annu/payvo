import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { UpdateUserDto } from "./dto/UpdateUserDto.js";
import { UserNotFoundError } from "./error/user.errors.js";
import { dbTransaction } from "@payvo/database/client";
import UserCacheService from "./user-cache.service.js";

@injectable()
export default class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(TYPES.UserCacheService)
    private readonly userCacheService: UserCacheService,
  ) {}

  async getUser(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  async updateUser(input: UpdateUserDto) {
    const { id, ...updates } = input;
    const updatedUser = await this.userRepo.update(id, updates);
    if (!updatedUser) throw new UserNotFoundError();
    return updatedUser;
  }

  async deleteUser(userId: string) {
    await dbTransaction(async (tx) => {
      const now = new Date();
      const deletedUser = await this.userRepo.softDelete(tx, {
        id: userId,
        deletedAt: now,
      });
      if (!deletedUser) throw new UserNotFoundError();

      const { sessionIds } =
        await this.userRepo.revokeSessionsForAccountDeletion(tx, {
          userId,
          revokedAt: now,
        });
      if (sessionIds.length > 0) {
        await this.userRepo.revokeRefreshTokensForAccountDeletion(tx, {
          sessionIds,
          revokedAt: now,
        });
      }
      const { merchantIds } =
        await this.userRepo.disableMerchantForAccountDeletion(tx, {
          userId,
        });
      if (merchantIds.length > 0) {
        await this.userRepo.revokeApiKeysForAccountDeletion(tx, {
          merchantIds,
          revokedAt: now,
        });
      }
    });
    await this.userCacheService.invalidateCachedUser(userId);
  }
}
