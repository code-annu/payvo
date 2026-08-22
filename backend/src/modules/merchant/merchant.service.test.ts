import MerchantService from "./merchant.service";
import {
  MerchantAccessDeniedError,
  MerchantNotFoundError,
} from "./merchant.errors";
import { Merchant } from "./entity/merchant.entity";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-21T12:00:00Z");

const mockMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ── Stub repositories ────────────────────────────────────────────────
function createMocks() {
  return {
    merchantRepo: {
      create: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      findByUserId: vi.fn(),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new MerchantService(mocks.merchantRepo as any);
}

// =====================================================================
// createMerchant
// =====================================================================
describe("MerchantService.createMerchant", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: MerchantService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should create a merchant and return it", async () => {
    mocks.merchantRepo.create.mockResolvedValue(mockMerchant);

    const result = await service.createMerchant("user-1");

    expect(mocks.merchantRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(result).toEqual({ merchant: mockMerchant });
  });
});

// =====================================================================
// getMerchant
// =====================================================================
describe("MerchantService.getMerchant", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: MerchantService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return the merchant when it exists and belongs to the user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);

    const result = await service.getMerchant("user-1", "merchant-1");

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(result).toEqual({ merchant: mockMerchant });
  });

  it("should throw MerchantNotFoundError if merchant does not exist", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.getMerchant("user-1", "non-existent"),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("non-existent");
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.getMerchant("user-1", "merchant-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
  });
});

// =====================================================================
// deleteMerchant
// =====================================================================
describe("MerchantService.deleteMerchant", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: MerchantService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should delete the merchant when it exists and belongs to the user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.merchantRepo.delete.mockResolvedValue(mockMerchant);

    await service.deleteMerchant("user-1", "merchant-1");

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.merchantRepo.delete).toHaveBeenCalledWith("merchant-1");
  });

  it("should throw MerchantNotFoundError if merchant does not exist", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteMerchant("user-1", "non-existent"),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("non-existent");
    expect(mocks.merchantRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.deleteMerchant("user-1", "merchant-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.merchantRepo.delete).not.toHaveBeenCalled();
  });
});

// =====================================================================
// getUserMerchants
// =====================================================================
describe("MerchantService.getUserMerchants", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: MerchantService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return all merchants belonging to the user", async () => {
    const merchantsList: Merchant[] = [
      mockMerchant,
      {
        id: "merchant-2",
        userId: "user-1",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    mocks.merchantRepo.findByUserId.mockResolvedValue(merchantsList);

    const result = await service.getUserMerchants("user-1");

    expect(mocks.merchantRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ merchants: merchantsList });
  });

  it("should return empty array if user has no merchants", async () => {
    mocks.merchantRepo.findByUserId.mockResolvedValue([]);

    const result = await service.getUserMerchants("user-1");

    expect(mocks.merchantRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ merchants: [] });
  });
});
