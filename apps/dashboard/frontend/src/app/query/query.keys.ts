export const userQueryKey = {
  account: ["account"] as const,
};

export const merchantQueryKey = {
  all: ["merchants"] as const,
  // list: () => [...merchantQueryKey.all, "list"] as const,
};

export const apiKeyQueryKey = {
  merchantApiKeys: (merchantId: string) =>
    ["merchant", merchantId, "api-keys"] as const,
  activeApiKey: (merchantId: string) =>
    ["merchant", merchantId, "active-api-key"] as const,
};

