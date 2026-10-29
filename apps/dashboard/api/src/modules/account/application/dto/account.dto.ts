import { UserTheme } from "@payvo/database/types";

export interface AccountDetailOutput {
  userId: string;
  profile: {
    fullName: string;
    phoneNumber: string | null;
    phoneVerifiedAt: Date | null;
    profilePictureUrl: string | null;
  };
  preferences: {
    language: { code: string; name: string };
    currency: {
      code: string;
      name: string;
      minorUnit: number;
      isEnabled: boolean;
    };
    theme: UserTheme;
    timezone: string;
  };
}
