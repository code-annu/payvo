import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { UpdateUserDto } from "./dto/UpdateUserDto.js";
import { UserNotFoundError, UserDeletedError } from "./error/user.errors.js";
import { User } from "./entity/user.entity.js";

@injectable()
export default class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  private async findActiveUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError("User not found");
    }
    if (user.deletedAt) {
      throw new UserDeletedError(
        "Account has been deactivated. Please contact support for assistance.",
      );
    }
    return user;
  }

  async getUser(userId: string) {
    return this.findActiveUserOrThrow(userId);
  }

  async updateUser(input: UpdateUserDto) {
    const { id, ...updates } = input;
    const user = await this.findActiveUserOrThrow(id);

    const updatedUser = await this.userRepo.update(id, updates);
    return updatedUser ?? user;
  }

  async deleteUser(userId: string) {
    await this.findActiveUserOrThrow(userId);
    await this.userRepo.softDelete(userId);
  }
}
