import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import {
  UserTheme,
  type SupportedCurrency,
  type SupportedLanguage,
  type UserPreference,
  type UserProfile,
} from "@payvo/database/types";
import AccountService from "./application/account.service.js";
import * as accountErrors from "./error/account.errors.js";
import AccountMapper from "./account.mapper.js";
import UserPreferencesRepository from "./repository/user-preferences.repository.js";
import UserProfileRepository from "./repository/user-profile.repository.js";
import type { AuthContract } from "@/modules/auth/contract/auth.contract.js";
import type { UserContract } from "@/modules/user/contract/user.contract.js";
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "./schema/account.schema.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "user-123";
const timestamp = new Date("2025-01-01T00:00:00.000Z");

const profile: UserProfile = {
  userId,
  fullName: "Payvo Customer",
  phoneNumber: null,
  phoneVerifiedAt: null,
  profilePictureUrl: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const language: SupportedLanguage = {
  code: "en",
  name: "English",
};

const currency: SupportedCurrency = {
  code: "USD",
  name: "US Dollar",
  minorUnit: 2,
  isEnabled: true,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const preferences = {
  userId,
  preferredLanguageCode: language.code,
  preferredCurrencyCode: currency.code,
  theme: UserTheme.SYSTEM,
  timezone: "UTC",
  createdAt: timestamp,
  updatedAt: timestamp,
  preferredLanguage: language,
  preferredCurrency: currency,
} satisfies UserPreference & {
  preferredLanguage: SupportedLanguage;
  preferredCurrency: SupportedCurrency;
};

const createInput: CreateAccountInput = {
  userId,
  profile: {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    profilePictureUrl: profile.profilePictureUrl,
  },
  preferences: {
    preferredLanguageCode: preferences.preferredLanguageCode,
    preferredCurrencyCode: preferences.preferredCurrencyCode,
    theme: preferences.theme,
  },
};

const transactionClient = {} as TransactionClient;

function createAccountServiceTestContext() {
  const userProfileRepo = new UserProfileRepository();
  const userPreferencesRepo = new UserPreferencesRepository();
  const findProfile = vi.spyOn(userProfileRepo, "findByUserId");
  const createProfile = vi.spyOn(userProfileRepo, "create");
  const updateProfile = vi.spyOn(userProfileRepo, "update");
  const findPreferences = vi.spyOn(userPreferencesRepo, "findByUserId");
  const findPreferencesWithRelations = vi.spyOn(
    userPreferencesRepo,
    "findByUserIdWithRelations",
  );
  const createPreferences = vi.spyOn(userPreferencesRepo, "create");
  const updatePreferences = vi.spyOn(userPreferencesRepo, "update");
  const deleteProfile = vi.spyOn(userProfileRepo, "deleteByUserId");
  const deletePreferences = vi.spyOn(userPreferencesRepo, "deleteByUserId");
  const userService: UserContract = {
    deleteUser: vi.fn(
      async (
        _data: { userId: string; now: Date },
        _tx?: TransactionClient,
      ) => {},
    ),
  };
  const authService: AuthContract = {
    revokeSessionsAndTokens: vi.fn(
      async (
        _tx: TransactionClient,
        _data: { userId: string; now: Date },
      ) => {},
    ),
  };

  return {
    service: new AccountService(
      userProfileRepo,
      userPreferencesRepo,
      new AccountMapper(),
      userService,
      authService,
    ),
    findProfile,
    createProfile,
    updateProfile,
    findPreferences,
    findPreferencesWithRelations,
    createPreferences,
    updatePreferences,
    deleteProfile,
    deletePreferences,
    userService,
    authService,
  };
}

function mockTransaction() {
  vi.mocked(dbTransaction).mockImplementation(async (callback) =>
    callback(transactionClient),
  );
}

function mockExistingAccount(
  context: ReturnType<typeof createAccountServiceTestContext>,
) {
  context.findProfile.mockResolvedValue(profile);
  context.findPreferencesWithRelations.mockResolvedValue(preferences);
}

describe("AccountService.createAccount", () => {
  let context: ReturnType<typeof createAccountServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAccountServiceTestContext();
    mockTransaction();
  });

  it("creates the profile and preferences in a transaction", async () => {
    context.findProfile.mockResolvedValue(null);
    context.findPreferences.mockResolvedValue(null);
    context.createProfile.mockResolvedValue(profile);
    context.createPreferences.mockResolvedValue(preferences);

    const result = await context.service.createAccount(createInput);

    expect(context.findProfile).toHaveBeenCalledWith(userId);
    expect(context.findPreferences).toHaveBeenCalledWith(userId);
    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.createProfile).toHaveBeenCalledWith(transactionClient, {
      ...createInput.profile,
      userId,
    });
    expect(context.createPreferences).toHaveBeenCalledWith(transactionClient, {
      ...createInput.preferences,
      userId,
    });
    expect(result).toEqual({
      userId,
      profile: {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        phoneVerifiedAt: profile.phoneVerifiedAt,
        profilePictureUrl: profile.profilePictureUrl,
      },
      preferences: {
        language: { code: language.code, name: language.name },
        currency: {
          code: currency.code,
          name: currency.name,
          minorUnit: currency.minorUnit,
          isEnabled: currency.isEnabled,
        },
        theme: preferences.theme,
        timezone: preferences.timezone,
      },
    });
  });

  it.each(["profile", "preferences"] as const)(
    "rejects account creation when a %s already exists",
    async (existingResource) => {
      context.findProfile.mockResolvedValue(
        existingResource === "profile" ? profile : null,
      );
      context.findPreferences.mockResolvedValue(
        existingResource === "preferences" ? preferences : null,
      );

      await expect(
        context.service.createAccount(createInput),
      ).rejects.toBeInstanceOf(accountErrors.AccountAlreadyExistsError);

      expect(dbTransaction).not.toHaveBeenCalled();
      expect(context.createProfile).not.toHaveBeenCalled();
      expect(context.createPreferences).not.toHaveBeenCalled();
    },
  );
});

describe("AccountService.getAccountDetails", () => {
  let context: ReturnType<typeof createAccountServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAccountServiceTestContext();
  });

  it("returns the account with mapped profile and preference details", async () => {
    mockExistingAccount(context);

    const result = await context.service.getAccountDetails(userId);

    expect(context.findProfile).toHaveBeenCalledWith(userId);
    expect(context.findPreferencesWithRelations).toHaveBeenCalledWith(userId);
    expect(result.userId).toBe(userId);
    expect(result.profile.fullName).toBe(profile.fullName);
    expect(result.preferences.language).toEqual({
      code: language.code,
      name: language.name,
    });
    expect(result.preferences.currency).toEqual({
      code: currency.code,
      name: currency.name,
      minorUnit: currency.minorUnit,
      isEnabled: currency.isEnabled,
    });
  });

  it.each(["profile", "preferences"] as const)(
    "throws when the %s does not exist",
    async (missingResource) => {
      context.findProfile.mockResolvedValue(
        missingResource === "profile" ? null : profile,
      );
      context.findPreferencesWithRelations.mockResolvedValue(
        missingResource === "preferences" ? null : preferences,
      );

      await expect(
        context.service.getAccountDetails(userId),
      ).rejects.toBeInstanceOf(accountErrors.AccountNotFoundError);
    },
  );
});

describe("AccountService.updateAccount", () => {
  let context: ReturnType<typeof createAccountServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAccountServiceTestContext();
    mockTransaction();
    mockExistingAccount(context);
  });

  it("updates both profile and preferences when both have fields", async () => {
    const input: UpdateAccountInput = {
      userId,
      profile: { fullName: "Updated Customer" },
      preferences: { theme: UserTheme.DARK },
    };
    const updatedProfile = { ...profile, fullName: "Updated Customer" };
    const updatedPreferences = { ...preferences, theme: UserTheme.DARK };
    context.updateProfile.mockResolvedValue(updatedProfile);
    context.updatePreferences.mockResolvedValue(updatedPreferences);

    await context.service.updateAccount(input);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.updateProfile).toHaveBeenCalledWith(
      transactionClient,
      userId,
      {
        fullName: "Updated Customer",
      },
    );
    expect(context.updatePreferences).toHaveBeenCalledWith(
      transactionClient,
      userId,
      { theme: UserTheme.DARK },
    );
  });

  it("updates the profile only when only profile fields are provided", async () => {
    const input: UpdateAccountInput = {
      userId,
      profile: { fullName: "Updated Customer" },
    };
    context.updateProfile.mockResolvedValue({
      ...profile,
      fullName: "Updated Customer",
    });

    const result = await context.service.updateAccount(input);

    expect(context.updateProfile).toHaveBeenCalledOnce();
    expect(context.updatePreferences).not.toHaveBeenCalled();
    expect(result.profile.fullName).toBe("Updated Customer");
    expect(result.preferences.theme).toBe(preferences.theme);
  });

  it("updates preferences only when only preference fields are provided", async () => {
    const input: UpdateAccountInput = {
      userId,
      preferences: { theme: UserTheme.DARK },
    };
    context.updatePreferences.mockResolvedValue({
      ...preferences,
      theme: UserTheme.DARK,
    });

    const result = await context.service.updateAccount(input);

    expect(context.updateProfile).not.toHaveBeenCalled();
    expect(context.updatePreferences).toHaveBeenCalledOnce();
    expect(result.profile.fullName).toBe(profile.fullName);
    expect(result.preferences.theme).toBe(UserTheme.DARK);
  });

  it("does not call either update method when neither update object is provided", async () => {
    const input: UpdateAccountInput = {
      userId,
    };

    const result = await context.service.updateAccount(input);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.updateProfile).not.toHaveBeenCalled();
    expect(context.updatePreferences).not.toHaveBeenCalled();
    expect(result.profile.fullName).toBe(profile.fullName);
    expect(result.preferences.theme).toBe(preferences.theme);
  });

  it.each(["profile", "preferences"] as const)(
    "throws when the %s does not exist",
    async (missingResource) => {
      context.findProfile.mockResolvedValue(
        missingResource === "profile" ? null : profile,
      );
      context.findPreferencesWithRelations.mockResolvedValue(
        missingResource === "preferences" ? null : preferences,
      );

      await expect(
        context.service.updateAccount({
          userId,
          profile: { fullName: "Updated Customer" },
        }),
      ).rejects.toBeInstanceOf(accountErrors.AccountNotFoundError);

      expect(dbTransaction).not.toHaveBeenCalled();
      expect(context.updateProfile).not.toHaveBeenCalled();
      expect(context.updatePreferences).not.toHaveBeenCalled();
    },
  );
});

describe("AccountService.deleteAccount", () => {
  let context: ReturnType<typeof createAccountServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAccountServiceTestContext();
    mockTransaction();
  });

  it("deletes account data, revokes sessions, and soft-deletes the user in a transaction", async () => {
    context.deleteProfile.mockResolvedValue();
    context.deletePreferences.mockResolvedValue();

    await context.service.deleteAccount(userId);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.deleteProfile).toHaveBeenCalledWith(
      transactionClient,
      userId,
    );
    expect(context.deletePreferences).toHaveBeenCalledWith(
      transactionClient,
      userId,
    );

    const now = vi.mocked(context.authService.revokeSessionsAndTokens).mock
      .calls![0]![1]!.now;
    expect(now).toBeInstanceOf(Date);
    expect(context.authService.revokeSessionsAndTokens).toHaveBeenCalledWith(
      transactionClient,
      { now, userId },
    );
    expect(context.userService.deleteUser).toHaveBeenCalledWith(
      { now, userId },
      transactionClient,
    );
  });
});
