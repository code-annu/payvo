import { UserTheme } from "@payvo/database/types";

export function createProfileRequestBody() {
  return {
    fullName: "Payvo Customer",
    phoneNumber: null,
    profilePictureUrl: null,
    preferredLanguageCode: "en",
    preferredCurrencyCode: "USD",
    theme: UserTheme.SYSTEM,
  };
}
