import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import type { ApiKeyContract } from "@/modules/api-key/contract/api-key.contract.js";
import type { AuthContract } from "@/modules/auth/contract/auth.contract.js";
import type { MerchantContract } from "@/modules/merchant/contract/merchant.contract.js";
import type { UserContract } from "@/modules/user/contract/user.contract.js";
import type { UserAddressContract } from "../contract/user-address.contract.js";
import DeleteAccountUsecase from "../application/usecase/DeleteAccountUsecase.js";
import UserProfileRepository from "../repository/user-profile.repository.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "user-123";
const transactionClient = {} as TransactionClient;

function createDeleteAccountUsecaseTestContext() {
  const userProfileRepo = new UserProfileRepository();
  const deleteProfile = vi
    .spyOn(userProfileRepo, "deleteByUserId")
    .mockResolvedValue();
  const userAddressContract: UserAddressContract = {
    deleteUserAddresses: vi.fn(async () => {}),
  };
  const authService: AuthContract = {
    revokeSessionsAndTokens: vi.fn(async () => {}),
  };
  const userService: UserContract = {
    deleteUser: vi.fn(async () => {}),
  };
  const merchantContract: MerchantContract = {
    getActiveMerchantOwnedByUser: vi.fn(),
    closeUserMerchants: vi.fn(async () => {}),
  };
  const apiKeyContract: ApiKeyContract = {
    revokeUserApiKeys: vi.fn(async () => {}),
  };

  return {
    usecase: new DeleteAccountUsecase(
      userProfileRepo,
      userAddressContract,
      authService,
      userService,
      merchantContract,
      apiKeyContract,
    ),
    deleteProfile,
    userAddressContract,
    authService,
    userService,
    merchantContract,
    apiKeyContract,
  };
}

function mockTransaction() {
  vi.mocked(dbTransaction).mockImplementation(async (callback) =>
    callback(transactionClient),
  );
}

describe("DeleteAccountUsecase.execute", () => {
  let context: ReturnType<typeof createDeleteAccountUsecaseTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createDeleteAccountUsecaseTestContext();
    mockTransaction();
  });

  it("closes merchants, revokes API keys and sessions, and deletes the user in one transaction", async () => {
    await context.usecase.execute(userId);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.merchantContract.closeUserMerchants).toHaveBeenCalledWith(
      transactionClient,
      { userId, closedAt: expect.any(Date) },
    );
    expect(context.apiKeyContract.revokeUserApiKeys).toHaveBeenCalledWith(
      transactionClient,
      { userId, revokedAt: expect.any(Date) },
    );
    expect(context.deleteProfile).toHaveBeenCalledWith(
      transactionClient,
      userId,
    );
    expect(
      context.userAddressContract.deleteUserAddresses,
    ).toHaveBeenCalledWith(transactionClient, userId);

    const now = vi.mocked(context.authService.revokeSessionsAndTokens).mock
      .calls[0]![1]!.now;
    expect(context.authService.revokeSessionsAndTokens).toHaveBeenCalledWith(
      transactionClient,
      { now, userId },
    );
    expect(context.userService.deleteUser).toHaveBeenCalledWith(
      { now, userId },
      transactionClient,
    );
  });
});
