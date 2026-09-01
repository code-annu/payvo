import { describe, it, expect, vi, beforeEach } from "vitest";
import MerchantService from "../merchant.service.js";
import type MerchantRepository from "../repository/merchant.repository.js";
import type { Merchant } from "../entity/merchant.entity.js";
import { MerchantNotFoundError } from "../error/merchant.errors.js";


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

const activeMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("MerchantService.activateMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(() => {
    merchantRepo = createMockMerchantRepo({
      activateMerchant: vi.fn().mockResolvedValue(activeMerchant),
    });

    merchantService = new MerchantService(merchantRepo as MerchantRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should activate merchant and return it", async () => {
    const result = await merchantService.activateMerchant("merchant-1");

    expect(result).toEqual(activeMerchant);
    expect(result.isActive).toBe(true);
  });

  it("should call activateMerchant with correct id", async () => {
    await merchantService.activateMerchant("merchant-1");

    expect(merchantRepo.activateMerchant).toHaveBeenCalledWith("merchant-1");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw MerchantNotFoundError when merchant does not exist", async () => {
    vi.mocked(merchantRepo.activateMerchant).mockResolvedValue(null);

    await expect(
      merchantService.activateMerchant("non-existent-id"),
    ).rejects.toThrow(MerchantNotFoundError);
    await expect(
      merchantService.activateMerchant("non-existent-id"),
    ).rejects.toThrow("Merchant not found");
  });
});
