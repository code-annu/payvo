import { beforeEach, describe, expect, it, vi } from "vitest";
import GetUserMerchantsUsecase from "../application/usecase/GetUserMerchantsUsecase.js";

describe("GetUserMerchantsUsecase", () => {
  const merchantRepository = { findByUser: vi.fn() };
  const usecase = new GetUserMerchantsUsecase(merchantRepository as never);
  const merchants = {
    userId: "user-1",
    merchants: [
      { id: "merchant-1", mid: "mid-1", isActive: true },
      { id: "merchant-2", mid: "mid-2", isActive: false },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepository.findByUser.mockResolvedValue(merchants);
  });

  it("returns all merchants belonging to the user", async () => {
    await expect(usecase.execute("user-1")).resolves.toEqual(merchants);
    expect(merchantRepository.findByUser).toHaveBeenCalledWith("user-1");
  });

  it("returns an empty merchant collection when the user has none", async () => {
    const emptyMerchants = { userId: "user-1", merchants: [] };
    merchantRepository.findByUser.mockResolvedValue(emptyMerchants);

    await expect(usecase.execute("user-1")).resolves.toEqual(emptyMerchants);
  });
});
