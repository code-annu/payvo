import z from "zod";

export const EmailSchema = z
  .email("Must be a valid email address")
  .trim()
  .toLowerCase();

export const PasswordSchema = z
  .string("Must be a string")
  .trim()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&#]/, "Password must contain at least one special character")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter");

export const FullnameSchema = z
  .string("fullname must be a valid string")
  .trim()
  .min(3, "fullname must be at least 3 characters long")
  .max(120, "fullname must not be exceed 120 characters");

export const PhoneNumberSchema = z
  .string("phone number must be a valid string")
  .trim()
  .max(20, "phone number not be exceed 20 characters")
  .nullish()
  .transform((v) => (v === undefined ? null : v));

export const ProfilePictureUrlSchema = z
  .url("profile picture url must be a valid url")
  .trim()
  .nullish()
  .transform((v) => (v === undefined ? null : v));

export const PreferredLanguageCodeSchema = z
  .string("preferred language code must be a string")
  .trim()
  .min(1, "Preferred language  code must be at least 1 character long")
  .max(10, "Preferred language code must not exceed 10 characters");

export const PreferredCurrencyCodeSchema = z
  .string("Preferred currency code must be a string")
  .trim()
  .length(3, "Preferred currency code must be exactly 3 characters");

export const TimezoneSchema = z
  .string("Time zone must be a string")
  .trim()
  .max(64, "Time zone must not exceed 64 characters");

export const UserThemeSchema = z.enum(
  ["SYSTEM", "LIGHT", "DARK"],
  "Theme must be one of them ['SYSTEM', 'LIGHT', 'DARK']",
);
