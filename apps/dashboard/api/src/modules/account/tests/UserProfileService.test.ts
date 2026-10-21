import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import {
  UserTheme,
  type SupportedCurrency,
  type SupportedLanguage,
  type UserProfile,
} from "@payvo/database/types";
import UserProfileService from "../application/service/user-profile.service.js";
import * as accountErrors from "../error/account.errors.js";
import UserProfileRepository from "../repository/user-profile.repository.js";
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from "../application/dto/user-profile.dto.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "user-123";
const timestamp = new Date("2025-01-01T00:00:00.000Z");

const language: SupportedLanguage = { code: "en", name: "English" };
const currency: SupportedCurrency = {
  code: "USD",
  name: "US Dollar",
  minorUnit: 2,
  isEnabled: true,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const profile = {
  userId,
  fullName: "Payvo Customer",
  phoneNumber: null,
  phoneVerifiedAt: null,
  profilePictureUrl: null,
  preferredLanguageCode: language.code,
  preferredCurrencyCode: currency.code,
  theme: UserTheme.SYSTEM,
  timezone: "UTC",
  createdAt: timestamp,
  updatedAt: timestamp,
  preferredLanguage: language,
  preferredCurrency: currency,
} satisfies UserProfile & {
  preferredLanguage: SupportedLanguage;
  preferredCurrency: SupportedCurrency;
};

const createInput: CreateUserProfileInput = {
  userId,
  fullName: profile.fullName,
  phoneNumber: null,
  profilePictureUrl: null,
  preferredLanguageCode: profile.preferredLanguageCode,
  preferredCurrencyCode: profile.preferredCurrencyCode,
  theme: profile.theme,
};

const transactionClient = {} as TransactionClient;

function createServiceTestContext() {
  const userProfileRepo = new UserProfileRepository();
  return {
    service: new UserProfileService(userProfileRepo),
    findProfile: vi.spyOn(userProfileRepo, "findByUserId"),
    findProfileWithRelations: vi.spyOn(
      userProfileRepo,
      "findByUserIdWithRelations",
    ),
    createProfile: vi.spyOn(userProfileRepo, "create"),
    updateProfile: vi.spyOn(userProfileRepo, "update"),
  };
}

function mockTransaction() {
  vi.mocked(dbTransaction).mockImplementation(async (callback) =>
    callback(transactionClient),
  );
}

describe("UserProfileService.createUserProfile", () => {
  let context: ReturnType<typeof createServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createServiceTestContext();
    mockTransaction();
  });

  it("creates all profile fields in one transaction", async () => {
    context.findProfile.mockResolvedValue(null);
    context.createProfile.mockResolvedValue(profile);

    const result = await context.service.createUserProfile(createInput);

    expect(context.findProfile).toHaveBeenCalledWith(userId);
    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.createProfile).toHaveBeenCalledWith(transactionClient, {
      ...createInput,
    });
    expect(result).toEqual({ profile });
  });

  it("rejects creation when the user already has a profile", async () => {
    context.findProfile.mockResolvedValue(profile);

    await expect(
      context.service.createUserProfile(createInput),
    ).rejects.toBeInstanceOf(accountErrors.AccountAlreadyExistsError);

    expect(dbTransaction).not.toHaveBeenCalled();
    expect(context.createProfile).not.toHaveBeenCalled();
  });
});

describe("UserProfileService.getUserProfileDetails", () => {
  let context: ReturnType<typeof createServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createServiceTestContext();
  });

  it("returns the profile and its related language and currency", async () => {
    context.findProfileWithRelations.mockResolvedValue(profile);

    const result = await context.service.getUserProfileDetails(userId);

    expect(context.findProfileWithRelations).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ profile });
  });

  it("throws when the profile does not exist", async () => {
    context.findProfileWithRelations.mockResolvedValue(null);

    await expect(
      context.service.getUserProfileDetails(userId),
    ).rejects.toBeInstanceOf(accountErrors.AccountNotFoundError);
  });
});

describe("UserProfileService.updateUserProfile", () => {
  let context: ReturnType<typeof createServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createServiceTestContext();
    mockTransaction();
    context.findProfile.mockResolvedValue(profile);
  });

  it("updates any supplied profile or preference fields together", async () => {
    const input: UpdateUserProfileInput = {
      userId,
      fullName: "Updated Customer",
      theme: UserTheme.DARK,
    };
    const updatedProfile = {
      ...profile,
      fullName: "Updated Customer",
      theme: UserTheme.DARK,
    };
    context.updateProfile.mockResolvedValue(updatedProfile);

    const result = await context.service.updateUserProfile(input);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.updateProfile).toHaveBeenCalledWith(
      transactionClient,
      userId,
      { fullName: "Updated Customer", theme: UserTheme.DARK },
    );
    expect(result).toEqual({ userId, profile: updatedProfile });
  });

  it("updates only the provided fields", async () => {
    const updatedProfile = { ...profile, fullName: "Updated Customer" };
    context.updateProfile.mockResolvedValue(updatedProfile);

    const result = await context.service.updateUserProfile({
      userId,
      fullName: "Updated Customer",
    });

    expect(context.updateProfile).toHaveBeenCalledOnce();
    expect(result.profile.fullName).toBe("Updated Customer");
  });

  it("rejects updates when the profile does not exist", async () => {
    context.findProfile.mockResolvedValue(null);

    await expect(
      context.service.updateUserProfile({
        userId,
        fullName: "Updated Customer",
      }),
    ).rejects.toBeInstanceOf(accountErrors.AccountNotFoundError);

    expect(dbTransaction).not.toHaveBeenCalled();
    expect(context.updateProfile).not.toHaveBeenCalled();
  });
});
