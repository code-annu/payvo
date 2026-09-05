import axiosClient from "@/core/axios/axios.client";
import type {
  Merchant,
  MerchantResponse,
  UserMerchants,
  UserMerchantsResponse,
} from "./merchant.types";

export default abstract class MerchantApi {
  static async createMerchant(): Promise<Merchant> {
    const response = await axiosClient.post<MerchantResponse>("/merchants");
    return response.data.data.merchant;
  }

  static async deleteMerchant(merchantId: string): Promise<void> {
    await axiosClient.delete<MerchantResponse>(`/merchants/${merchantId}`);
  }

  static async updateMerchant(merchantId: string): Promise<Merchant> {
    const response = await axiosClient.put<MerchantResponse>(
      `/merchants/${merchantId}`,
    );
    return response.data.data.merchant;
  }

  static async getUserMerchants(): Promise<UserMerchants> {
    const response = await axiosClient.get<UserMerchantsResponse>("/merchants");
    return response.data.data;
  }
}
