import type { SuccessResponse } from "@/core/api/success.response";

export interface SignupRequest {
  email: string;
  password: string;
  fullname: string;
  companyName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse extends SuccessResponse<{
  accessToken: string;
}> {}
