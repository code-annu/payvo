import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types";
import UserRepository from "./repository/user.repository";
import { UserNotFoundError } from "./user.errors";
import { UpdateMeDto } from "./dto/UpdateMeDto";

@injectable()
export default class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError("User not found");
    }
    return { user };
  }

  async updateMe(userId: string, data: UpdateMeDto) {
    const user = await this.userRepo.findById(userId);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError("User not found");
    }

    const updatedUser = await this.userRepo.update(userId, data);
    return { user: updatedUser };
  }

  async deleteMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user || user.deletedAt) {
      throw new UserNotFoundError("User not found");
    }

    await this.userRepo.delete(userId);
    await this.userRepo.revokeAllSessions(userId);
  }
}
