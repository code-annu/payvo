import type { TransactionClient } from "@payvo/database/client";

export interface AuthContract {
  revokeSessionsAndTokens: (
    tx: TransactionClient,
    data: { userId: string; now: Date },
  ) => Promise<void>;
}
