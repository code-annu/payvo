import { beforeEach, describe, expect, it, vi } from "vitest";
import UpdateAccountUsecase from "../application/usecase/UpdateAccountUsecase.js";
import { AccountNotFoundError } from "../error/account.errors.js";

describe("UpdateAccountUsecase", () => {
  const userRepository = { update: vi.fn() };
  const usecase = new UpdateAccountUsecase(userRepository as never);
  const input = {
    userId: "user-1",
    fullname: "Updated User",
    companyName: "Updated Company",
  };
  const updatedUser = {
    id: "user-1",
    email: "user@example.com",
    fullname: input.fullname,
    companyName: input.companyName,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.update.mockResolvedValue(updatedUser);
  });

  it("updates and returns the account", async () => {
    await expect(usecase.execute(input)).resolves.toEqual(updatedUser);
    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      fullname: input.fullname,
      companyName: input.companyName,
    });
  });

  it("rejects when the account does not exist", async () => {
    userRepository.update.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      fullname: input.fullname,
      companyName: input.companyName,
    });
  });
});
