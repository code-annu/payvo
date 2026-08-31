import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserRepository from "./repository/user.repository.js";
import { UpdateUserDto } from "./dto/UpdateUserDto.js";
import { UserNotFoundError } from "./error/user.errors.js";

@injectable()
export default class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError("User not found");
    }
    return user;
  }

  async updateUser(input: UpdateUserDto) {
    const { userId, ...updates } = input;
    const user = await this.userRepo.updateUser(userId, updates);
    if (!user) {
      throw new UserNotFoundError("User not found");
    }
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError("User not found");
    }
    await this.userRepo.softDeleteUser(id);
    return user;
  }
}
