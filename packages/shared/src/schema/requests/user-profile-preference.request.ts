import z from "zod";
import * as profileFields from "../fields/user-profile.fields.js";
import * as preferenceFields from "../fields/user-preference.fields.js";

export const CreateAccountSchema = {
  body: z.strictObject({
    profile: z.strictObject({
      fullName: profileFields.FullnameSchema.nonempty(
        "Fullname cannot be empty",
      ),
      phoneNumber: profileFields.PhoneNumberSchema.transform((v) =>
        v === undefined ? null : v,
      ),
      profilePictureUrl: profileFields.ProfilePictureUrlSchema.transform((v) =>
        v === undefined ? null : v,
      ),
    }),
    preferences: z.strictObject({
      preferredLanguageCode:
        preferenceFields.PreferredLanguageCodeSchema.nonempty(
          "Preferred language code cannot be empty",
        ),
      preferredCurrencyCode:
        preferenceFields.PreferredLanguageCodeSchema.nonempty(
          "Preferred currency code cannot be empty",
        ),
      theme: preferenceFields.UserThemeSchema,
    }),
  }),
};

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
