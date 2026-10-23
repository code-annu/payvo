import { prisma } from "@payvo/database/client";
import {
  UserTheme,
  type UserProfileUncheckedCreateInput,
} from "@payvo/database/types";

export default abstract class ProfileFactory {
  static async create(
    userId: string,
    data: Partial<Omit<UserProfileUncheckedCreateInput, "userId">> = {},
  ) {
    return prisma.userProfile.create({
      data: {
        userId,
        fullName: "Payvo Customer",
        preferredLanguageCode: "en",
        preferredCurrencyCode: "USD",
        theme: UserTheme.SYSTEM,
        timezone: "UTC",
        ...data,
      },
    });
  }

  static async find(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } });
  }
}
