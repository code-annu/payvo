import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
}));

vi.mock("@payvo/database/types", () => ({}));

// ---------------------------------------------------------------------------
// Mock external shared packages
// ---------------------------------------------------------------------------

vi.mock("@payvo/shared/crypto", () => ({
  generateAlphaNumericId: vi.fn(),
}));

import { generateAlphaNumericId } from "@payvo/shared/crypto";
import MerchantService from "../merchant.service.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-09-11T00:00:00.000Z");

const fakeMerchant: Merchant = {
  id: "merchant-1",
  mid: "mid-123456",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ---------------------------------------------------------------------------
// Helpers – create mock repository instance
// ---------------------------------------------------------------------------

function createMockMerchantRepo(): MerchantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByMid: vi.fn(),
    findByUserId: vi.fn(),
    delete: vi.fn(),
  } as unknown as MerchantRepository;
}

// ---------------------------------------------------------------------------
// Tests – createMerchant
// ---------------------------------------------------------------------------

describe("MerchantService.createMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    merchantRepo = createMockMerchantRepo();
    merchantService = new MerchantService(merchantRepo);
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should generate a unique mid and create a merchant successfully", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("unique-mid-1");
    vi.mocked(merchantRepo.findByMid).mockResolvedValue(null);
    vi.mocked(merchantRepo.create).mockResolvedValue(fakeMerchant);

    const result = await merchantService.createMerchant("user-1");

    expect(generateAlphaNumericId).toHaveBeenCalledOnce();
    expect(merchantRepo.findByMid).toHaveBeenCalledOnce();
    expect(merchantRepo.findByMid).toHaveBeenCalledWith("unique-mid-1");
    expect(merchantRepo.create).toHaveBeenCalledOnce();
    expect(merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      mid: "unique-mid-1",
    });
    expect(result).toStrictEqual(fakeMerchant);
  });

  // -----------------------------------------------------------------------
  // Collision handling (while loop)
  // -----------------------------------------------------------------------

  it("should loop and regenerate mid if mid already exists in the database", async () => {
    vi.mocked(generateAlphaNumericId)
      .mockReturnValueOnce("collision-mid-1")
      .mockReturnValueOnce("unique-mid-2");

    // First lookup finds existing merchant, second finds null (available)
    vi.mocked(merchantRepo.findByMid)
      .mockResolvedValueOnce(fakeMerchant)
      .mockResolvedValueOnce(null);

    vi.mocked(merchantRepo.create).mockResolvedValue({
      ...fakeMerchant,
      mid: "unique-mid-2",
    });

    const result = await merchantService.createMerchant("user-1");

    expect(generateAlphaNumericId).toHaveBeenCalledTimes(2);
    expect(merchantRepo.findByMid).toHaveBeenCalledTimes(2);
    expect(merchantRepo.findByMid).toHaveBeenNthCalledWith(1, "collision-mid-1");
    expect(merchantRepo.findByMid).toHaveBeenNthCalledWith(2, "unique-mid-2");
    expect(merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      mid: "unique-mid-2",
    });
    expect(result.mid).toBe("unique-mid-2");
  });

  it("should handle multiple consecutive collisions before finding a unique mid", async () => {
    vi.mocked(generateAlphaNumericId)
      .mockReturnValueOnce("taken-1")
      .mockReturnValueOnce("taken-2")
      .mockReturnValueOnce("taken-3")
      .mockReturnValueOnce("free-4");

    vi.mocked(merchantRepo.findByMid)
      .mockResolvedValueOnce(fakeMerchant)
      .mockResolvedValueOnce(fakeMerchant)
      .mockResolvedValueOnce(fakeMerchant)
      .mockResolvedValueOnce(null);

    vi.mocked(merchantRepo.create).mockResolvedValue({
      ...fakeMerchant,
      mid: "free-4",
    });

    const result = await merchantService.createMerchant("user-1");

    expect(generateAlphaNumericId).toHaveBeenCalledTimes(4);
    expect(merchantRepo.findByMid).toHaveBeenCalledTimes(4);
    expect(merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      mid: "free-4",
    });
    expect(result.mid).toBe("free-4");
  });

  // -----------------------------------------------------------------------
  // Error propagation
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by merchantRepo.findByMid", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("mid-1");
    vi.mocked(merchantRepo.findByMid).mockRejectedValue(
      new Error("DB read error"),
    );

    await expect(merchantService.createMerchant("user-1")).rejects.toThrow(
      "DB read error",
    );
    expect(merchantRepo.create).not.toHaveBeenCalled();
  });

  it("should propagate errors thrown by merchantRepo.create", async () => {
    vi.mocked(generateAlphaNumericId).mockReturnValue("unique-mid");
    vi.mocked(merchantRepo.findByMid).mockResolvedValue(null);
    vi.mocked(merchantRepo.create).mockRejectedValue(
      new Error("DB write error"),
    );

    await expect(merchantService.createMerchant("user-1")).rejects.toThrow(
      "DB write error",
    );
  });
});
