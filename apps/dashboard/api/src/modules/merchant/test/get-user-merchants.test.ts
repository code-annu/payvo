import "reflect-metadata";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { UserMerchants } from "../entity/user-merchants.entity.js";

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

const fakeUserMerchants: UserMerchants = {
  userId: "user-1",
  merchants: [
    {
      id: "merchant-1",
      mid: "mid-111111",
      isActive: true,
    },
    {
      id: "merchant-2",
      mid: "mid-222222",
      isActive: false,
    },
  ],
};

const emptyUserMerchants: UserMerchants = {
  userId: "user-2",
  merchants: [],
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
// Tests – getUserMerchants
// ---------------------------------------------------------------------------

describe("MerchantService.getUserMerchants", () => {
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

  it("should return user merchants for the given userId", async () => {
    vi.mocked(merchantRepo.findByUserId).mockResolvedValue(fakeUserMerchants);

    const result = await merchantService.getUserMerchants("user-1");

    expect(merchantRepo.findByUserId).toHaveBeenCalledOnce();
    expect(merchantRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toStrictEqual(fakeUserMerchants);
  });

  it("should return empty merchants array when user has no merchants", async () => {
    vi.mocked(merchantRepo.findByUserId).mockResolvedValue(emptyUserMerchants);

    const result = await merchantService.getUserMerchants("user-2");

    expect(merchantRepo.findByUserId).toHaveBeenCalledOnce();
    expect(merchantRepo.findByUserId).toHaveBeenCalledWith("user-2");
    expect(result.merchants).toHaveLength(0);
    expect(result).toStrictEqual(emptyUserMerchants);
  });

  // -----------------------------------------------------------------------
  // Error propagation
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by merchantRepo.findByUserId", async () => {
    vi.mocked(merchantRepo.findByUserId).mockRejectedValue(
      new Error("DB read error"),
    );

    await expect(
      merchantService.getUserMerchants("user-1"),
    ).rejects.toThrow("DB read error");
  });
});
