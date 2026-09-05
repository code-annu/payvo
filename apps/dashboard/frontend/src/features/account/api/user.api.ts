import axiosClient from "@/core/axios/axios.client";
import type { User, UserResponse, UserUpdateRequest } from "./user.types";

export default abstract class UserApi {
  static async getMe(): Promise<User> {
    const response = await axiosClient.get<UserResponse>("/users/me");
    return response.data.data.user;
  }

  static async updateMe(data: UserUpdateRequest): Promise<User> {
    const response = await axiosClient.patch<UserResponse>("/users/me", data);
    return response.data.data.user;
  }

  static async deleteMe(): Promise<void> {
    await axiosClient.delete("/users/me");
  }

  
}
