export interface AuthResponse {
  data: { valid: boolean; merchantId: string; environment: ApiKeyEnvironment };
}

type ApiKeyEnvironment = "TEST" | "LIVE";
