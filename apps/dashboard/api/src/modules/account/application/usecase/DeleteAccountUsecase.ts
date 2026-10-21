import { dbTransaction } from "@payvo/database/client";
import { AuthTypes } from "@/modules/auth/auth.types.js";
import type { AuthContract } from "@/modules/auth/contract/auth.contract.js";
import { ApiKeyTypes } from "@/modules/api-key/api-key.types.js";
import type { ApiKeyContract } from "@/modules/api-key/contract/api-key.contract.js";
import { MerchantTypes } from "@/modules/merchant/merchant.types.js";
import type { MerchantContract } from "@/modules/merchant/contract/merchant.contract.js";
import { UserTypes } from "@/modules/user/user.types.js";
import type { UserContract } from "@/modules/user/contract/user.contract.js";
import { inject, injectable } from "inversify";
import { AccountTypes } from "../../account.types.js";
import type { UserAddressContract } from "../../contract/user-address.contract.js";
import UserProfileRepository from "../../repository/user-profile.repository.js";

@injectable()
export default class DeleteAccountUsecase {
  constructor(
    @inject(AccountTypes.UserProfileRepository)
    private readonly userProfileRepo: UserProfileRepository,
    @inject(AccountTypes.UserAddressContract)
    private readonly userAddressContract: UserAddressContract,
    @inject(AuthTypes.AuthService)
    private readonly authService: AuthContract,
    @inject(UserTypes.UserService)
    private readonly userService: UserContract,
    @inject(MerchantTypes.MerchantContract)
    private readonly merchantContract: MerchantContract,
    @inject(ApiKeyTypes.ApiKeyContract)
    private readonly apiKeyContract: ApiKeyContract,
  ) {}

  async execute(userId: string): Promise<void> {
    const now = new Date();
    await dbTransaction(async (tx) => {
      await this.merchantContract.closeUserMerchants(tx, {
        userId,
        closedAt: now,
      });
      await this.apiKeyContract.revokeUserApiKeys(tx, {
        userId,
        revokedAt: now,
      });
      await this.userProfileRepo.deleteByUserId(tx, userId);
      await this.userAddressContract.deleteUserAddresses(tx, userId);
      await this.authService.revokeSessionsAndTokens(tx, { now, userId });
      await this.userService.deleteUser({ userId, now }, tx);
    });
  }
}
