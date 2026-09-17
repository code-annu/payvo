import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";
import type { GetMerchantDto } from "../dto/GetMerchantDto.js";
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

const getMerchantInput: GetMerchantDto = {
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

describe("MerchantService.getMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepo = createMockMerchantRepo();
    merchantService = new MerchantService(merchantRepo);
  });

  it("should return the merchant when found for the requesting user", async () => {
    vi.mocked(merchantRepo.findUserMerchant).mockResolvedValue(fakeMerchant);

    const result = await merchantService.getMerchantDetails(getMerchantInput);

    expect(merchantRepo.findUserMerchant).toHaveBeenCalledOnce();
    expect(merchantRepo.findUserMerchant).toHaveBeenCalledWith(getMerchantInput);
    expect(result).toStrictEqual(fakeMerchant);
  });

  it("should throw MerchantNotFoundError when the merchant does not exist", async () => {
    vi.mocked(merchantRepo.findUserMerchant).mockResolvedValue(null);

    await expect(
      merchantService.getMerchantDetails(getMerchantInput),
    ).rejects.toThrow(MerchantNotFoundError);
    await expect(
      merchantService.getMerchantDetails(getMerchantInput),
    ).rejects.toThrow("Merchant not found");
  });

  it("should propagate repository errors", async () => {
    vi.mocked(merchantRepo.findUserMerchant).mockRejectedValue(
      new Error("DB read error"),
    );

    await expect(
      merchantService.getMerchantDetails(getMerchantInput),
    ).rejects.toThrow("DB read error");
  });
});
