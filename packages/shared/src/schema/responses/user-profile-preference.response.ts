import z from "zod";
import { UserThemeSchema } from "../fields/user-profile.fields.js";

export interface UserProfileResponse {
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  phoneVerifiedAt: Date | null;
  profilePictureUrl: string | null;
  language: { code: string; name: string };
  currency: {
    code: string;
    name: string;
    minorUnit: number;
    isEnabled: boolean;
  };
  theme: UserTheme;
  timezone: string;
}

export type UserTheme = z.infer<typeof UserThemeSchema>;
