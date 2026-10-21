import { TransactionClient } from "@payvo/database/client";

export interface UserAddressContract {
  deleteUserAddresses(tx: TransactionClient, userId: string): Promise<void>;
}
