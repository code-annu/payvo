import { describe, it, expect, vi, beforeEach } from "vitest";
import MerchantService from "../merchant.service.js";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { UserMerchants } from "../entity/user-merchants.entity.js";


// ── Mock @payvo/database to prevent Prisma from connecting ─────────
vi.mock("@payvo/database", () => ({
  db: {},
}));

// ── Factories ──────────────────────────────────────────────────────
function createMockMerchantRepo(
  overrides: Partial<MerchantRepository> = {},
): MerchantRepository {
  return {
    createMerchants: vi.fn(),
    findMerchantById: vi.fn(),
    findMerchantsByUserId: vi.fn(),
    deleteMerchant: vi.fn(),
    inactivateMerchant: vi.fn(),
    activateMerchant: vi.fn(),
    ...overrides,
  } as unknown as MerchantRepository;
}

// ── Fixtures ───────────────────────────────────────────────────────
const now = new Date("2026-08-30T12:00:00Z");

const fakeUserMerchants: UserMerchants = {
  userId: "user-1",
  merchants: [
    {
      id: "merchant-1",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

// ── Tests ──────────────────────────────────────────────────────────
describe("MerchantService.getUserMerchants", () => {
  let merchantService: MerchantService;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(() => {
    merchantRepo = createMockMerchantRepo({
      findMerchantsByUserId: vi.fn().mockResolvedValue(fakeUserMerchants),
    });

    merchantService = new MerchantService(merchantRepo as MerchantRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return user merchants list", async () => {
    const result = await merchantService.getUserMerchants("user-1");

    expect(result).toEqual(fakeUserMerchants);
  });

  it("should call findMerchantsByUserId with correct userId", async () => {
    await merchantService.getUserMerchants("user-1");

    expect(merchantRepo.findMerchantsByUserId).toHaveBeenCalledWith("user-1");
  });

  it("should return empty merchants array when user has no merchants", async () => {
    const emptyMerchants: UserMerchants = { userId: "user-2", merchants: [] };
    vi.mocked(merchantRepo.findMerchantsByUserId).mockResolvedValue(emptyMerchants);

    const result = await merchantService.getUserMerchants("user-2");

    expect(result).toEqual(emptyMerchants);
  });
});
