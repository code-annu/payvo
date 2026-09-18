import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteMerchantUsecase from "../application/usecase/DeleteMerchantUsecase.js";
import { MerchantNotFoundError } from "../error/merchant.errors.js";

describe("DeleteMerchantUsecase", () => {
  const merchantRepository = { deleteMerchant: vi.fn() };
  const usecase = new DeleteMerchantUsecase(merchantRepository as never);
  const input = { merchantId: "merchant-1", userId: "user-1" };
  const merchant = {
    id: input.merchantId,
    mid: "mid-1",
    userId: input.userId,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepository.deleteMerchant.mockResolvedValue(merchant);
  });

  it("deletes and returns the merchant for its owner", async () => {
    await expect(usecase.execute(input)).resolves.toEqual(merchant);
    expect(merchantRepository.deleteMerchant).toHaveBeenCalledWith(input);
  });

  it("rejects when the merchant does not exist for the user", async () => {
    merchantRepository.deleteMerchant.mockResolvedValue(null);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      MerchantNotFoundError,
    );
    expect(merchantRepository.deleteMerchant).toHaveBeenCalledWith(input);
  });
});
