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

const fakeMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("MerchantService.deleteMerchant", () => {
  let merchantService: MerchantService;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(() => {
    merchantRepo = createMockMerchantRepo({
      findMerchantById: vi.fn().mockResolvedValue(fakeMerchant),
      deleteMerchant: vi.fn().mockResolvedValue(undefined),
    });

    merchantService = new MerchantService(merchantRepo as MerchantRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return merchant on successful delete", async () => {
    const result = await merchantService.deleteMerchant("merchant-1");

    expect(result).toEqual(fakeMerchant);
  });

  it("should call findMerchantById with correct id", async () => {
    await merchantService.deleteMerchant("merchant-1");

    expect(merchantRepo.findMerchantById).toHaveBeenCalledWith("merchant-1");
  });

  it("should call deleteMerchant with correct id", async () => {
    await merchantService.deleteMerchant("merchant-1");

    expect(merchantRepo.deleteMerchant).toHaveBeenCalledWith("merchant-1");
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(merchantRepo.findMerchantById).mockImplementation(async () => {
      callOrder.push("findMerchantById");
      return fakeMerchant;
    });
    vi.mocked(merchantRepo.deleteMerchant).mockImplementation(async () => {
      callOrder.push("deleteMerchant");
    });

    await merchantService.deleteMerchant("merchant-1");

    expect(callOrder).toEqual(["findMerchantById", "deleteMerchant"]);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw MerchantNotFoundError when merchant is not found", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(null);

    await expect(
      merchantService.deleteMerchant("non-existent-id"),
    ).rejects.toThrow(MerchantNotFoundError);
    await expect(
      merchantService.deleteMerchant("non-existent-id"),
    ).rejects.toThrow("Merchant not found");
  });

  it("should not call deleteMerchant when merchant is not found", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(null);

    await merchantService.deleteMerchant("non-existent-id").catch(() => {});

    expect(merchantRepo.deleteMerchant).not.toHaveBeenCalled();
  });
});
