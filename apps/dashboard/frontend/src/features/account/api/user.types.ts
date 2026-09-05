import type { SuccessResponse } from "@/core/api/success.response";

export interface User {
  id: string;
  email: string;
  fullname: string;
  companyName: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateRequest {
  fullname?: string;
  companyName?: string | null;
}

export type UserResponse = SuccessResponse<{ user: User }>;
