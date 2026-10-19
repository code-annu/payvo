import z from "zod";

export const FullnameSchema = z
  .string("fullname must be a valid string")
  .trim()
  .min(3, "fullname must be at least 3 characters long")
  .max(120, "fullname must not be exceed 120 characters");

export const PhoneNumberSchema = z
  .string("phone number must be a valid string")
  .trim()
  .max(20, "phone number not be exceed 20 characters")
  .nullish();

export const ProfilePictureUrlSchema = z
  .url("profile picture url must be a valid url")
  .trim()
  .nullish();
