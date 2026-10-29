import { UserTheme } from "@payvo/database/types";

export function createAccountRequestBody() {
  return {
    profile: {
      fullName: "Payvo Customer",
      phoneNumber: null,
      profilePictureUrl: null,
    },
    preferences: {
      preferredLanguageCode: "en",
      preferredCurrencyCode: "USD",
      theme: UserTheme.SYSTEM,
    },
  };
}
