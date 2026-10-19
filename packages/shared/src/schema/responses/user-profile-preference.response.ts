import z from "zod";
import { UserThemeSchema } from "../fields/user-preference.fields.js";

export interface UserProfilePreferenceResponse {
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

export type UserTheme = z.infer<typeof UserThemeSchema>;
