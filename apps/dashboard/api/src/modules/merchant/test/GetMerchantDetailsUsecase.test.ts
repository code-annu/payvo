import { beforeEach, describe, expect, it, vi } from "vitest";
import GetMerchantDetailsUsecase from "../application/usecase/GetMerchantDetailsUsecase.js";
import { MerchantNotFoundError } from "../error/merchant.errors.js";

describe("GetMerchantDetailsUsecase", () => {
  const merchantRepository = { findMerchant: vi.fn() };
  const usecase = new GetMerchantDetailsUsecase(merchantRepository as never);
  const input = { merchantId: "merchant-1", userId: "user-1" };
  const merchant = {
    id: input.merchantId,
    mid: "mid-1",
    userId: input.userId,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepository.findMerchant.mockResolvedValue(merchant);
  });

  it("returns the requested merchant for its owner", async () => {
    await expect(usecase.execute(input)).resolves.toEqual(merchant);
    expect(merchantRepository.findMerchant).toHaveBeenCalledWith(input);
  });

  it("rejects when the merchant does not exist for the user", async () => {
    merchantRepository.findMerchant.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(merchantRepository.findMerchant).toHaveBeenCalledWith(input);
  });
});
