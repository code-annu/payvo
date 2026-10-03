import axiosClient from "@/core/axios/axios.client";
import axios from "axios";
import type {
  ActiveApiKeyData,
  ActiveApiKeyResponse,
  ApiKeyEnvironment,
  GenerateApiKeyPayload,
  GeneratedApiKeyData,
  GeneratedApiKeyResponse,
  MerchantApiKeysData,
  MerchantApiKeysResponse,
  RevokedApiKeyData,
  RevokeApiKeyResponse,
  RotateApiKeyPayload,
  RotateApiKeyResponse,
} from "./api-key.types";

export default abstract class ApiKeyApi {
  static async getMerchantApiKeys(
    merchantId: string,
  ): Promise<MerchantApiKeysData> {
    const response = await axiosClient.get<MerchantApiKeysResponse>(
      `/merchants/${merchantId}/api-keys`,
    );
    return response.data.data;
  }

  static async getActiveApiKey(
    merchantId: string,
    environment: ApiKeyEnvironment = "TEST",
  ): Promise<ActiveApiKeyData | null> {
    try {
      const response = await axiosClient.get<ActiveApiKeyResponse>(
        `/merchants/${merchantId}/api-keys/active`,
        { params: { environment } },
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async generateApiKey(
    merchantId: string,
    payload: GenerateApiKeyPayload,
  ): Promise<GeneratedApiKeyData> {
    const response = await axiosClient.post<GeneratedApiKeyResponse>(
      `/merchants/${merchantId}/api-keys/generate`,
      payload,
    );
    return response.data.data;
  }

  static async rotateApiKey(
    merchantId: string,
    payload: RotateApiKeyPayload,
  ): Promise<GeneratedApiKeyData> {
    const response = await axiosClient.post<RotateApiKeyResponse>(
      `/merchants/${merchantId}/api-keys/rotate`,
      payload,
    );
    return response.data.data;
  }

  static async revokeApiKey(
    merchantId: string,
    apiKeyId: string,
  ): Promise<RevokedApiKeyData> {
    const response = await axiosClient.post<RevokeApiKeyResponse>(
      `/merchants/${merchantId}/api-keys/${apiKeyId}/revoke`,
    );
    return response.data.data;
  }
}
