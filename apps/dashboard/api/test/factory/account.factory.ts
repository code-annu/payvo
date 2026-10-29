import { prisma } from "@payvo/database/client";
import {
  UserTheme,
  type UserPreferenceUncheckedCreateInput,
  type UserProfileUncheckedCreateInput,
} from "@payvo/database/types";

export default abstract class AccountFactory {
  static async create(
    userId: string,
    data: {
      profile?: Partial<Omit<UserProfileUncheckedCreateInput, "userId">>;
      preferences?: Partial<Omit<UserPreferenceUncheckedCreateInput, "userId">>;
    } = {},
  ) {
    const [profile, preferences] = await Promise.all([
      this.createProfile(userId, data.profile),
      this.createPreferences(userId, data.preferences),
    ]);

    return { profile, preferences };
  }

  static async find(userId: string) {
    const [profile, preferences] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userPreference.findUnique({ where: { userId } }),
    ]);

    return { profile, preferences };
  }

  static async createProfile(
    userId: string,
    data: Partial<Omit<UserProfileUncheckedCreateInput, "userId">> = {},
  ) {
    return prisma.userProfile.create({
      data: {
        userId,
        fullName: "Payvo Customer",
        ...data,
      },
    });
  }

  static async createPreferences(
    userId: string,
    data: Partial<Omit<UserPreferenceUncheckedCreateInput, "userId">> = {},
  ) {
    return prisma.userPreference.create({
      data: {
        userId,
        preferredLanguageCode: "en",
        preferredCurrencyCode: "USD",
        theme: UserTheme.SYSTEM,
        timezone: "UTC",
        ...data,
      },
    });
  }
}
