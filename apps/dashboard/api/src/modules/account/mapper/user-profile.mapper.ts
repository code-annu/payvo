import { injectable } from "inversify";
import {
  SupportedCurrency,
  SupportedLanguage,
  UserProfile,
} from "@payvo/database/types";
import { UserProfileResponse } from "@payvo/shared/schema/responses";

type UserProfileWithRelations = UserProfile & {
  preferredLanguage: SupportedLanguage;
  preferredCurrency: SupportedCurrency;
};

@injectable()
export default class UserProfileMapper {
  mapToAccountResponse(profile: UserProfileWithRelations): UserProfileResponse {
    const { preferredLanguage, preferredCurrency } = profile;
    return {
      userId: profile.userId,
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      phoneVerifiedAt: profile.phoneVerifiedAt,
      profilePictureUrl: profile.profilePictureUrl,
      language: { code: preferredLanguage.code, name: preferredLanguage.name },
      currency: {
        code: preferredCurrency.code,
        name: preferredCurrency.name,
        minorUnit: preferredCurrency.minorUnit,
        isEnabled: preferredCurrency.isEnabled,
      },
      theme: profile.theme,
      timezone: profile.timezone,
    };
  }
}
