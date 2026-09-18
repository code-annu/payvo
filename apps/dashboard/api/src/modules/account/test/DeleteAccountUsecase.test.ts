import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteAccountUsecase from "../application/usecase/DeleteAccountUsecase.js";
import { AccountNotFoundError } from "../error/account.errors.js";

describe("DeleteAccountUsecase", () => {
  const userRepository = { softDelete: vi.fn() };
  const usecase = new DeleteAccountUsecase(userRepository as never);
  const deletedUser = { id: "user-1", deletedAt: new Date() };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.softDelete.mockResolvedValue(deletedUser);
  });

  it("soft-deletes the account", async () => {
    await expect(usecase.execute("user-1")).resolves.toEqual(deletedUser);
    expect(userRepository.softDelete).toHaveBeenCalledWith("user-1");
  });

  it("rejects when the account does not exist", async () => {
    userRepository.softDelete.mockResolvedValue(null);

    await expect(usecase.execute("missing-user")).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(userRepository.softDelete).toHaveBeenCalledWith("missing-user");
  });
});
