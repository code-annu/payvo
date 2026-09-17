import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";

vi.mock("@payvo/database/client", () => ({ client: {} }));
vi.mock("@payvo/database/types", () => ({}));
vi.mock("@payvo/shared/crypto", () => ({
  generateAlphaNumericId: vi.fn(),
}));

import { generateAlphaNumericId } from "@payvo/shared/crypto";
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

describe("MerchantService.createMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    merchantRepo = createMockMerchantRepo();
    merchantService = new MerchantService(merchantRepo);
  });

  it("should generate a unique mid and create a merchant on success", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("unique-mid-1");
    vi.mocked(merchantRepo.checkMidExists).mockResolvedValue(false);
    vi.mocked(merchantRepo.create).mockResolvedValue(fakeMerchant);

    const result = await merchantService.createMerchant("user-1");

    expect(generateAlphaNumericId).toHaveBeenCalledOnce();
    expect(merchantRepo.checkMidExists).toHaveBeenCalledWith("unique-mid-1");
    expect(merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      mid: "unique-mid-1",
    });
    expect(result).toStrictEqual(fakeMerchant);
  });

  it("should retry until it finds a free mid", async () => {
    vi.mocked(generateAlphaNumericId)
      .mockReturnValueOnce("taken-1")
      .mockReturnValueOnce("free-2");
    vi.mocked(merchantRepo.checkMidExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.mocked(merchantRepo.create).mockResolvedValue({
      ...fakeMerchant,
      mid: "free-2",
    });

    const result = await merchantService.createMerchant("user-1");

    expect(generateAlphaNumericId).toHaveBeenCalledTimes(2);
    expect(merchantRepo.checkMidExists).toHaveBeenNthCalledWith(1, "taken-1");
    expect(merchantRepo.checkMidExists).toHaveBeenNthCalledWith(2, "free-2");
    expect(merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      mid: "free-2",
    });
    expect(result.mid).toBe("free-2");
  });

  it("should propagate errors thrown by merchantRepo.checkMidExists", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("mid-1");
    vi.mocked(merchantRepo.checkMidExists).mockRejectedValue(
      new Error("DB read error"),
    );

    await expect(merchantService.createMerchant("user-1")).rejects.toThrow(
      "DB read error",
    );
    expect(merchantRepo.create).not.toHaveBeenCalled();
  });

  it("should propagate errors thrown by merchantRepo.create", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("unique-mid");
    vi.mocked(merchantRepo.checkMidExists).mockResolvedValue(false);
    vi.mocked(merchantRepo.create).mockRejectedValue(
      new Error("DB write error"),
    );

    await expect(merchantService.createMerchant("user-1")).rejects.toThrow(
      "DB write error",
    );
  });
});
