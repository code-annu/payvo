import z from "zod";

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
