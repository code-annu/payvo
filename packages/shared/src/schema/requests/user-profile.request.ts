import z from "zod";
import * as profileFields from "../fields/user-profile.fields.js";

export const CreateUserProfileSchema = {
  body: z.strictObject({
    fullName: profileFields.FullnameSchema.nonempty("Fullname cannot be empty"),
    phoneNumber: profileFields.PhoneNumberSchema.transform((value) =>
      value === undefined ? null : value,
    ),
    profilePictureUrl: profileFields.ProfilePictureUrlSchema.transform(
      (value) => (value === undefined ? null : value),
    ),
    preferredLanguageCode: profileFields.PreferredLanguageCodeSchema.nonempty(
      "preferred language code cannot be empty",
    ),
    preferredCurrencyCode: profileFields.PreferredCurrencyCodeSchema.nonempty(
      "preferred currency code cannot be empty",
    ),
    theme: profileFields.UserThemeSchema,
    timezone: profileFields.TimezoneSchema.optional(),
  }),
};

export type CreateUserProfileRequest = z.infer<
  typeof CreateUserProfileSchema.body
>;

export const UpdateUserProfileSchema = {
  body: CreateUserProfileSchema.body
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one profile field must be provided",
    ),
};
