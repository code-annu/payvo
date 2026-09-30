import { z } from "zod";
import type { UserUpdateRequest } from "../api/user.types";

/**
 * Zod validation schema for updating user details based on UserUpdateRequest.
 */
export const updateUserSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name must be at most 50 characters"),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name must be at most 100 characters")
    .optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type UpdateUserFormValues = UpdateUserFormData;

// Compile-time assertion ensuring UpdateUserFormData matches UserUpdateRequest
type _AssertUpdateUser = UpdateUserFormData extends UserUpdateRequest ? true : false;
const _typeCheck: _AssertUpdateUser = true;
void _typeCheck;

export const UpdateUserSchema = updateUserSchema;
export default updateUserSchema;
