import { describe, it, expect, vi, beforeEach } from "vitest";
import MerchantService from "../merchant.service.js";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";


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

const fakeMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("MerchantService.createMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(() => {
    merchantRepo = createMockMerchantRepo({
      createMerchants: vi.fn().mockResolvedValue(fakeMerchant),
    });

    merchantService = new MerchantService(merchantRepo as MerchantRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should create a merchant and return it", async () => {
    const result = await merchantService.createMerchant("user-1");

    expect(result).toEqual(fakeMerchant);
  });

  it("should call createMerchants with correct userId", async () => {
    await merchantService.createMerchant("user-1");

    expect(merchantRepo.createMerchants).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });
});
