import { beforeEach, describe, expect, it, vi } from "vitest";
import GetAccountUsecase from "../application/usecase/GetAccountUsecase.js";
import { AccountNotFoundError } from "../error/account.errors.js";

describe("GetAccountUsecase", () => {
  const userRepository = { findById: vi.fn() };
  const usecase = new GetAccountUsecase(userRepository as never);
  const user = {
    id: "user-1",
    email: "user@example.com",
    passwordHash: "stored-password-hash",
    fullname: "Test User",
    companyName: "Test Company",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findById.mockResolvedValue(user);
  });

  it("returns the account for the requested user", async () => {
    await expect(usecase.execute("user-1")).resolves.toEqual(user);
    expect(userRepository.findById).toHaveBeenCalledWith("user-1");
  });

  it("rejects when the account does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute("missing-user")).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(userRepository.findById).toHaveBeenCalledWith("missing-user");
  });
});
