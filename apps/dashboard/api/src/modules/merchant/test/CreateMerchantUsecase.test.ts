import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateMerchantUsecase from "../application/usecase/CreateMerchantUsecase.js";

const mocks = vi.hoisted(() => ({
  generateAlphaNumericId: vi.fn(),
}));

vi.mock("@payvo/shared/crypto", () => ({
  generateAlphaNumericId: mocks.generateAlphaNumericId,
}));

describe("CreateMerchantUsecase", () => {
  const merchantRepository = { create: vi.fn() };
  const usecase = new CreateMerchantUsecase(merchantRepository as never);
  const merchant = {
    id: "merchant-1",
    mid: "merchant-mid-1",
    userId: "user-1",
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateAlphaNumericId.mockReturnValue("merchant-mid-1");
    merchantRepository.create.mockResolvedValue(merchant);
  });

  it("generates a MID, creates the merchant for the user, and returns it", async () => {
    await expect(usecase.execute("user-1")).resolves.toEqual(merchant);

    expect(mocks.generateAlphaNumericId).toHaveBeenCalledOnce();
    expect(merchantRepository.create).toHaveBeenCalledWith({
      mid: "merchant-mid-1",
      userId: "user-1",
    });
  });

  it("propagates repository failures", async () => {
    const error = new Error("database unavailable");
    merchantRepository.create.mockRejectedValue(error);

    await expect(usecase.execute("user-1")).rejects.toBe(error);
  });
});
