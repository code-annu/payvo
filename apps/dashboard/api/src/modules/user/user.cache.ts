import TYPES from "@/core/di/inversify.types.js";
import { injectable, inject } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { deleteCache, getCache, setCache } from "@payvo/redis/cache";

interface CachedUser {
  readonly id: string;
  readonly email: string;
  readonly fullname: string;
  readonly isEmailVerified: boolean;
}

function userKey(userId: string) {
  return `user:cache:${userId}`;
}

@injectable()
export default class UserCache {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async getCachedUser(userId: string): Promise<CachedUser | null> {
    let cachedUser = await getCache<CachedUser>(userKey(userId));
    if (!cachedUser) {
      const user = await this.userRepo.findById(userId);
      if (!user) return null;

      cachedUser = {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        isEmailVerified: user.isEmailVerified,
      };
      setCache<CachedUser>({
        key: userKey(userId),
        value: cachedUser,
        ttlSeconds: 5 * 60,
      });
    }
    return cachedUser;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    return deleteCache(userKey(userId));
  }
}
