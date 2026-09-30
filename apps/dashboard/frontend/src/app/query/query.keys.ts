export const userQueryKey = {
  me: ["user"] as const,
};

export const merchantQueryKey = {
  all: ["merchants"] as const,
  detail: (id: string) => ["merchants", id] as const,
};

export const apiKeyQueryKey = {
  active: (merchantId: string, environment: string = "LIVE") =>
    ["merchants", merchantId, "api-keys", environment] as const,
};
