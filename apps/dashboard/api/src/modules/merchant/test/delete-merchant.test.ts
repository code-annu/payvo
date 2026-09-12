import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";
import type { DeleteMerchantDto } from "../dto/DeleteMerchantDto.js";
import {
  MerchantAccessDeniedError,
  MerchantInactiveError,
  MerchantNotFoundError,
} from "../error/merchant.errors.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
}));

vi.mock("@payvo/database/types", () => ({}));

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

const inactiveMerchant: Merchant = {
  ...fakeMerchant,
  isActive: false,
};

const otherUserMerchant: Merchant = {
  ...fakeMerchant,
  userId: "user-other",
};

const deleteMerchantInput: DeleteMerchantDto = {
  userId: "user-1",
  merchantId: "merchant-1",
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
// Tests – deleteMerchant
// ---------------------------------------------------------------------------

describe("MerchantService.deleteMerchant", () => {
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

  it("should delete the merchant when found, active, and owned by the requesting user", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(merchantRepo.delete).mockResolvedValue(undefined);

    await merchantService.deleteMerchant(deleteMerchantInput);

    expect(merchantRepo.findById).toHaveBeenCalledOnce();
    expect(merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(merchantRepo.delete).toHaveBeenCalledOnce();
    expect(merchantRepo.delete).toHaveBeenCalledWith("merchant-1");
  });

  // -----------------------------------------------------------------------
  // Not found check
  // -----------------------------------------------------------------------

  it("should throw MerchantNotFoundError and NOT delete when merchant does not exist", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow(MerchantNotFoundError);
    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("Merchant not found");

    expect(merchantRepo.delete).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // User mismatch check
  // -----------------------------------------------------------------------

  it("should throw MerchantAccessDeniedError and NOT delete when merchant belongs to another user", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(otherUserMerchant);

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow(MerchantAccessDeniedError);
    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("Merchant does not belong to user");

    expect(merchantRepo.delete).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Inactive check
  // -----------------------------------------------------------------------

  it("should throw MerchantInactiveError and NOT delete when merchant is inactive", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(inactiveMerchant);

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow(MerchantInactiveError);
    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("Merchant is inactive");

    expect(merchantRepo.delete).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Error propagation
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by merchantRepo.findById", async () => {
    vi.mocked(merchantRepo.findById).mockRejectedValue(
      new Error("DB read error"),
    );

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("DB read error");

    expect(merchantRepo.delete).not.toHaveBeenCalled();
  });

  it("should propagate errors thrown by merchantRepo.delete", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(merchantRepo.delete).mockRejectedValue(
      new Error("DB delete error"),
    );

    await expect(
      merchantService.deleteMerchant(deleteMerchantInput),
    ).rejects.toThrow("DB delete error");
  });
});
