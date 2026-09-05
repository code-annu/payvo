import axiosClient from "@/core/axios/axios.client";
import type {
  ApiKey,
  ApiKeyEnvironment,
  ApiKeyResponse,
  OldKeyRevokeStrategy,
} from "./api-key.types";

export default abstract class ApiKeyApi {
  /**
   * Get the active API key for a merchant and environment
   */
  static async getMerchantActiveApiKey(
    merchantId: string,
    environment: ApiKeyEnvironment = "LIVE",
  ): Promise<ApiKey> {
    const response = await axiosClient.get<ApiKeyResponse>(
      `/merchants/${merchantId}/api-keys`,
      {
        params: { environment },
      },
    );
    const data = response.data.data as { apiKey?: ApiKey } & ApiKey;
    return data?.apiKey ?? data;
  }

  /**
   * Generate a new API key for a merchant
   */
  static async generateApiKey(
    merchantId: string,
    environment: ApiKeyEnvironment = "LIVE",
  ): Promise<ApiKey> {
    const response = await axiosClient.post<ApiKeyResponse>(
      `/merchants/${merchantId}/api-keys`,
      { environment },
    );
    const data = response.data.data as { apiKey?: ApiKey } & ApiKey;
    return data?.apiKey ?? data;
  }

  /**
   * Rotate/regenerate an active API key
   */
  static async rotateApiKey(
    merchantId: string,
    data: {
      environment?: ApiKeyEnvironment;
      oldKeyRevokeStrategy: OldKeyRevokeStrategy;
    },
  ): Promise<ApiKey> {
    const response = await axiosClient.patch<ApiKeyResponse>(
      `/merchants/${merchantId}/api-keys/rotate`,
      {
        environment: data.environment ?? "LIVE",
        oldKeyRevokeStrategy: data.oldKeyRevokeStrategy,
      },
    );
    const resData = response.data.data as { apiKey?: ApiKey } & ApiKey;
    return resData?.apiKey ?? resData;
  }
}
