import type { TransactionClient } from "@payvo/database/client";

export interface UserContract {
  deleteUser(
    data: { userId: string; now: Date },
    tx?: TransactionClient,
  ): Promise<void>;
}
