import { injectable } from "inversify";
import { AccountDetailOutput } from "./application/dto/account.dto.js";
import {
  SupportedCurrency,
  SupportedLanguage,
  UserPreference,
  UserProfile,
} from "@payvo/database/types";

type UserPreferencesWitRelation = UserPreference & {
  preferredLanguage: SupportedLanguage;
  preferredCurrency: SupportedCurrency;
};

type AccountDetail = {
  userId: string;
  profile: UserProfile;
  preferences: UserPreferencesWitRelation;
};

@injectable()
export default class AccountMapper {
  mapToAccountDetailOutput(account: AccountDetail): AccountDetailOutput {
    const { profile, preferences } = account;
    return {
      userId: profile.userId,
      profile: {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        phoneVerifiedAt: profile.phoneVerifiedAt,
        profilePictureUrl: profile.profilePictureUrl,
      },
      preferences: {
        language: {
          code: preferences.preferredLanguage.code,
          name: preferences.preferredLanguage.name,
        },
        currency: {
          code: preferences.preferredCurrency.code,
          name: preferences.preferredCurrency.name,
          minorUnit: preferences.preferredCurrency.minorUnit,
          isEnabled: preferences.preferredCurrency.isEnabled,
        },
        theme: preferences.theme,
        timezone: preferences.timezone,
      },
    };
  }
}
