import axiosClient from "@/core/axios/axios.client";
import type { User, UserResponse, UserUpdateRequest } from "./user.types";

export default abstract class UserApi {
  static async getMe(): Promise<User> {
    const response = await axiosClient.get<UserResponse>("/account");
    return response.data.data;
  }

  static async updateMe(data: UserUpdateRequest): Promise<User> {
    const response = await axiosClient.patch<UserResponse>("/account", data);
    return response.data.data;
  }

  static async deleteMe(): Promise<void> {
    await axiosClient.delete("/account");
  }
}
