import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import { UpdateAccountDto } from "../dto/UpdateAccountDto.js";
import { AccountNotFoundError } from "../../error/account.errors.js";
import UserCache from "@/modules/user/user.cache.js";

@injectable()
export default class UpdateAccountUsecase {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.UserCache)
    private readonly userCache: UserCache,
  ) {}

  async execute(input: UpdateAccountDto) {
    const { userId, ...updates } = input;
    const user = await this.userRepository.update(input.userId, updates);
    if (!user) throw new AccountNotFoundError();
    await this.userCache.invalidateUserCache(userId);
    
    return user;
  }
}
