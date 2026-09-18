import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import { AccountNotFoundError } from "../../error/account.errors.js";

@injectable()
export default class GetAccountUsecase {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) throw new AccountNotFoundError();

    return user;
  }
}
