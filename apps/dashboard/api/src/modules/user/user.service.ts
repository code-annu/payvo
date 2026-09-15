import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { UpdateUserDto } from "./dto/UpdateUserDto.js";
import { UserNotFoundError, UserDeletedError } from "./error/user.errors.js";
import { User } from "./entity/user.entity.js";
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
    if (!user || user.deletedAt) throw new UserNotFoundError("User not found");
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
      const deletedUser = await this.userRepo.softDelete(tx, userId);
      if (!deletedUser) throw new UserNotFoundError();

      const { sessionIds } = await this.userRepo.revokeSessions(tx, userId);
      if (sessionIds.length > 0) {
        await this.userRepo.revokeRefreshTokens(tx, sessionIds);
      }
    });
    await this.userCacheService.invalidateCachedUser(userId);
  }
}
