import { dbTransaction } from "@payvo/database/client";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import AccountMapper from "../account.mapper.js";
import * as accountErrors from "../error/account.errors.js";
import UserPreferencesRepository from "../repository/user-preferences.repository.js";
import UserProfileRepository from "../repository/user-profile.repository.js";
import * as accountSchemas from "../schema/account.schema.js";
import { AccountDetailOutput } from "./dto/account.dto.js";
import { removeUndefined } from "@payvo/shared/util";
import type { UserContract } from "@/modules/user/contract/user.contract.js";
import type { AuthContract } from "@/modules/auth/contract/auth.contract.js";

@injectable()
export default class AccountService {
  constructor(
    @inject(TYPES.UserProfileRepository)
    private readonly userProfileRepo: UserProfileRepository,
    @inject(TYPES.UserPreferencesRepository)
    private readonly userPreferencesRepo: UserPreferencesRepository,
    @inject(TYPES.AccountMapper)
    private readonly accountMapper: AccountMapper,
    @inject(TYPES.UserService)
    private readonly userService: UserContract,
    @inject(TYPES.AuthService)
    private readonly authService: AuthContract,
  ) {}

  async createAccount(
    input: accountSchemas.CreateAccountInput,
  ): Promise<AccountDetailOutput> {
    const { profile, preferences, userId } = input;
    const [existingProfile, existingPreferences] = await Promise.all([
      this.userProfileRepo.findByUserId(userId),
      this.userPreferencesRepo.findByUserId(userId),
    ]);
    if (existingProfile || existingPreferences) {
      throw new accountErrors.AccountAlreadyExistsError();
    }

    return dbTransaction(async (tx) => {
      const createdProfile = await this.userProfileRepo.create(tx, {
        ...profile,
        userId,
      });

      const createPreferences = await this.userPreferencesRepo.create(tx, {
        ...preferences,
        userId,
      });

      return this.accountMapper.mapToAccountDetailOutput({
        profile: createdProfile,
        preferences: createPreferences,
        userId,
      });
    });
  }

  async getAccountDetails(userId: string): Promise<AccountDetailOutput> {
    const [profile, preferences] = await Promise.all([
      this.userProfileRepo.findByUserId(userId),
      this.userPreferencesRepo.findByUserIdWithRelations(userId),
    ]);

    if (!profile || !preferences) {
      throw new accountErrors.AccountNotFoundError("Account not found");
    }

    return this.accountMapper.mapToAccountDetailOutput({
      profile,
      preferences,
      userId,
    });
  }

  async updateAccount(
    input: accountSchemas.UpdateAccountInput,
  ): Promise<AccountDetailOutput> {
    const {
      profile: profileUpdates,
      preferences: preferencesUpdates,
      userId,
    } = input;
    const [existingProfile, existingPreferences] = await Promise.all([
      this.userProfileRepo.findByUserId(userId),
      this.userPreferencesRepo.findByUserIdWithRelations(userId),
    ]);

    if (!existingProfile || !existingPreferences) {
      throw new accountErrors.AccountNotFoundError("Account not found");
    }

    return dbTransaction(async (tx) => {
      let profile = existingProfile;
      let preferences = existingPreferences;

      if (profileUpdates) {
        profile = await this.userProfileRepo.update(
          tx,
          userId,
          removeUndefined(profileUpdates),
        );
      }

      if (preferencesUpdates) {
        preferences = await this.userPreferencesRepo.update(
          tx,
          userId,
          removeUndefined(preferencesUpdates),
        );
      }

      return this.accountMapper.mapToAccountDetailOutput({
        profile,
        preferences,
        userId,
      });
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    const now = new Date();
    await dbTransaction(async (tx) => {
      await this.userProfileRepo.deleteByUserId(tx, userId);
      await this.userPreferencesRepo.deleteByUserId(tx, userId);
      await this.authService.revokeSessionsAndTokens(tx, { now, userId });
      await this.userService.deleteUser({ userId, now }, tx);
    });
  }
}
