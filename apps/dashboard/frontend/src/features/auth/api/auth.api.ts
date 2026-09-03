import axiosClient from "@/core/axios/axios.client";
import type { AuthResponse, LoginRequest, SignupRequest } from "./types";

export default abstract class AuthApi {
  static async signup(body: SignupRequest) {
    const response = await axiosClient.post<AuthResponse>("/auth/signup", body);
    return response.data.data;
  }
  static async login(body: LoginRequest) {
    const response = await axiosClient.post<AuthResponse>("/auth/login", body);
    return response.data.data;
  }

  static async rotateToken() {
    const response = await axiosClient.post<AuthResponse>("/auth/rotate-token");
    return response.data.data;
  }
}
