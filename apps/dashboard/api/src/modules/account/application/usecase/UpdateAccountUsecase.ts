import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";
import { UpdateAccountDto } from "../dto/UpdateAccountDto.js";
import { AccountNotFoundError } from "../../error/account.errors.js";

@injectable()
export default class UpdateAccountUsecase {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateAccountDto) {
    const { userId, ...updates } = input;
    const user = await this.userRepository.update(input.userId, updates);
    if (!user) throw new AccountNotFoundError();

    return user;
  }
}
