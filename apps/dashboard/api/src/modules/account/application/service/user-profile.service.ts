import { dbTransaction } from "@payvo/database/client";
import { inject, injectable } from "inversify";
import { AccountTypes } from "../../account.types.js";
import * as accountErrors from "../../error/account.errors.js";
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from "../dto/user-profile.dto.js";
import { removeUndefined } from "@payvo/shared/util";
import UserProfileRepository from "../../repository/user-profile.repository.js";

@injectable()
export default class UserProfileService {
  constructor(
    @inject(AccountTypes.UserProfileRepository)
    private readonly userProfileRepo: UserProfileRepository,
  ) {}

  async createUserProfile(input: CreateUserProfileInput) {
    const { userId, ...profile } = input;
    const existingProfile = await this.userProfileRepo.findByUserId(userId);

    if (existingProfile) {
      throw new accountErrors.AccountAlreadyExistsError();
    }

    const createdProfile = await dbTransaction((tx) =>
      this.userProfileRepo.create(tx, { ...profile, userId }),
    );

    return { profile: createdProfile };
  }

  async getUserProfileDetails(userId: string) {
    const profile =
      await this.userProfileRepo.findByUserIdWithRelations(userId);

    if (!profile) {
      throw new accountErrors.AccountNotFoundError("Account not found");
    }

    return { profile };
  }

  async updateUserProfile(input: UpdateUserProfileInput) {
    const { userId, ...profileUpdates } = input;
    const existingProfile = await this.userProfileRepo.findByUserId(userId);

    if (!existingProfile) {
      throw new accountErrors.AccountNotFoundError("Account not found");
    }

    const profile = await dbTransaction((tx) =>
      this.userProfileRepo.update(tx, userId, removeUndefined(profileUpdates)),
    );

    return { userId, profile };
  }
}
