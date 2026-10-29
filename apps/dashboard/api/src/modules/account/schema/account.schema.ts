import {
  FullnameSchema,
  PhoneNumberSchema,
  PreferredLanguageCodeSchema,
  ProfilePictureUrlSchema,
  UserThemeSchema,
} from "@payvo/shared/schema";
import { StripUndefined } from "@payvo/shared/util";
import z from "zod";

export const CreateAccountSchema = {
  body: z.strictObject({
    profile: z.strictObject({
      fullName: FullnameSchema.nonempty("Fullname cannot be empty"),
      phoneNumber: PhoneNumberSchema,
      profilePictureUrl: ProfilePictureUrlSchema,
    }),
    preferences: z.strictObject({
      preferredLanguageCode: PreferredLanguageCodeSchema.nonempty(
        "Preferred language code cannot be empty",
      ),
      preferredCurrencyCode: PreferredLanguageCodeSchema.nonempty(
        "Preferred currency code cannot be empty",
      ),
      theme: UserThemeSchema,
    }),
  }),
};

export type CreateAccountInput = StripUndefined<
  z.infer<typeof CreateAccountSchema.body>
> & { userId: string };

export const UpdateAccountSchema = {
  body: z
    .strictObject({
      profile: CreateAccountSchema.body.shape.profile
        .partial()
        .refine(
          (data) => Object.keys(data).length > 0,
          "At least one profile field must be provided",
        ),
      preferences: CreateAccountSchema.body.shape.preferences
        .partial()
        .refine(
          (data) => Object.keys(data).length > 0,
          "At least one preferences field must be provided",
        ),
    })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one of (profile or preferences) field must be provided",
    ),
};

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema.body> & {
  userId: string;
};
