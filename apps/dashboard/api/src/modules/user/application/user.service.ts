import { inject, injectable } from "inversify";
import { UserContract } from "../contract/user.contract.js";
import TYPES from "@/core/di/inversify.types.js";
import UserRepository from "../repository/user.repository.js";
import type { TransactionClient } from "@payvo/database/client";

@injectable()
export default class UserService implements UserContract {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async deleteUser(
    data: { userId: string; now: Date },
    tx?: TransactionClient,
  ): Promise<void> {
    await this.userRepo.softDelete(data, tx);
  }
}
