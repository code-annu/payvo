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

export const webhookQueryKey = {
  merchantWebhooks: (merchantId: string) =>
    ["merchant", merchantId, "webhooks"] as const,
  merchantWebhookDetails: (merchantId: string, webhookId: string) =>
    ["merchant", merchantId, "webhook", webhookId, "details"] as const,
};

export const transactionQueryKey = {
  merchantTransactions: (merchantId: string) =>
    ["merchant", merchantId, "transactions"] as const,
  merchantTransactionDetails: (merchantId: string, transactionId: string) =>
    ["merchant", merchantId, "transaction", transactionId, "details"] as const,
};
