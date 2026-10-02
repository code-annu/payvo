import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteAccountUsecase from "../application/usecase/DeleteAccountUsecase.js";
import { AccountNotFoundError } from "../error/account.errors.js";

const mocks = vi.hoisted(() => ({
  dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/client", () => ({
  dbTransaction: mocks.dbTransaction,
}));

describe("DeleteAccountUsecase", () => {
  const tx = { id: "transaction" };
  const userRepository = { softDelete: vi.fn() };
  const sessionRepository = { revokeAllByUserId: vi.fn() };
  const refreshTokenRepository = { revokeAllByUserId: vi.fn() };
  const apiKeyRepository = { revokeAllByUserId: vi.fn() };

  const usecase = new DeleteAccountUsecase(
    userRepository as never,
    sessionRepository as never,
    refreshTokenRepository as never,
    apiKeyRepository as never,
  );

  const deletedUser = { id: "user-1", deletedAt: new Date() };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbTransaction.mockImplementation(async (callback) => callback(tx));
    refreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);
    sessionRepository.revokeAllByUserId.mockResolvedValue(undefined);
    apiKeyRepository.revokeAllByUserId.mockResolvedValue(undefined);
    userRepository.softDelete.mockResolvedValue(deletedUser);
  });

  it("revokes all tokens, sessions, api keys and soft-deletes the user in one transaction", async () => {
    const calls: string[] = [];
    refreshTokenRepository.revokeAllByUserId.mockImplementation(async () => {
      calls.push("refresh-tokens");
    });
    sessionRepository.revokeAllByUserId.mockImplementation(async () => {
      calls.push("sessions");
    });
    apiKeyRepository.revokeAllByUserId.mockImplementation(async () => {
      calls.push("api-keys");
    });
    userRepository.softDelete.mockImplementation(async () => {
      calls.push("soft-delete");
      return deletedUser;
    });

    const result = await usecase.execute("user-1");

    expect(result).toEqual(deletedUser);
    expect(mocks.dbTransaction).toHaveBeenCalledOnce();

    // Verify correct execution order
    expect(calls).toEqual([
      "refresh-tokens",
      "sessions",
      "api-keys",
      "soft-delete",
    ]);

    // Verify all calls received the transaction client and matching args
    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ userId: "user-1", now: expect.any(Date) }),
    );
    expect(sessionRepository.revokeAllByUserId).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ userId: "user-1", now: expect.any(Date) }),
    );
    expect(apiKeyRepository.revokeAllByUserId).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ userId: "user-1", now: expect.any(Date) }),
    );
    expect(userRepository.softDelete).toHaveBeenCalledWith("user-1", tx);
  });

  it("throws AccountNotFoundError when user does not exist", async () => {
    userRepository.softDelete.mockResolvedValue(null);

    await expect(usecase.execute("missing-user")).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(mocks.dbTransaction).toHaveBeenCalledOnce();
  });

  it("does not soft-delete or revoke later resources when an earlier step fails", async () => {
    const error = new Error("database failure");
    refreshTokenRepository.revokeAllByUserId.mockRejectedValue(error);

    await expect(usecase.execute("user-1")).rejects.toBe(error);

    expect(sessionRepository.revokeAllByUserId).not.toHaveBeenCalled();
    expect(apiKeyRepository.revokeAllByUserId).not.toHaveBeenCalled();
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });
});
