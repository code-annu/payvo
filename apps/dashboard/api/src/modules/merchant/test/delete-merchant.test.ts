import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";
import type { DeleteMerchantDto } from "../dto/DeleteMerchantDto.js";
import { MerchantNotFoundError } from "../error/merchant.errors.js";

vi.mock("@payvo/database/client", () => ({ client: {} }));
vi.mock("@payvo/database/types", () => ({}));

import MerchantService from "../merchant.service.js";

const now = new Date("2026-09-11T00:00:00.000Z");

const fakeMerchant: Merchant = {
  id: "merchant-1",
  mid: "mid-123456",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const deleteMerchantInput: DeleteMerchantDto = {
  userId: "user-1",
  merchantId: "merchant-1",
};

function createMockMerchantRepo(): MerchantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByMid: vi.fn(),
    findUserMerchant: vi.fn(),
    findByUserId: vi.fn(),
    checkMidExists: vi.fn(),
    delete: vi.fn(),
  } as unknown as MerchantRepository;
}

describe("MerchantService.deleteMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepo = createMockMerchantRepo();
    merchantService = new MerchantService(merchantRepo);
  });

  it("should delete the merchant when the repository returns it", async () => {
    vi.mocked(merchantRepo.delete).mockResolvedValue(fakeMerchant);

    await merchantService.deleteMerchant(deleteMerchantInput);

    expect(merchantRepo.delete).toHaveBeenCalledOnce();
    expect(merchantRepo.delete).toHaveBeenCalledWith(deleteMerchantInput);
  });

  it("should throw MerchantNotFoundError when delete returns null", async () => {
    vi.mocked(merchantRepo.delete).mockResolvedValue(null);

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow(MerchantNotFoundError);
    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("Merchant not found");
  });

  it("should propagate errors thrown by merchantRepo.delete", async () => {
    vi.mocked(merchantRepo.delete).mockRejectedValue(
      new Error("DB delete error"),
    );

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("DB delete error");
  });
});
