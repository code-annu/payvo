import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { redisClient } from "@payvo/redis";

export interface CachedUser {
  readonly id: string;
  readonly deletedAt: Date | null;
}

function userKey(userId: string) {
  return `user:${userId}`;
}

@injectable()
export default class UserCacheService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async getCachedUser(userId: string): Promise<CachedUser | null> {
    const key = userKey(userId);
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as CachedUser;
      }
    } catch (err) {
      console.log(err);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) return null;
    try {
      const cachedUser = { id: user.id, deletedAt: user.deletedAt };
      await redisClient.set(key, JSON.stringify(cachedUser));
      return cachedUser;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async invalidateCachedUser(userId: string) {
    try {
      const key = userKey(userId);
      await redisClient.del(key);
    } catch (err) {
      console.log(err);
    }
  }
}
