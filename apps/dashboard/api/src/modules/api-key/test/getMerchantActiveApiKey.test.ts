import { describe, it, expect, vi, beforeEach } from "vitest";
import ApiKeyService from "../api-key.service.js";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import type MerchantRepository from "../../merchant/repository/merchant.repository.js";
import type { ApiKey } from "../entity/api-key.entity.js";
import type { Merchant } from "../../merchant/entity/merchant.entity.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import {
  MerchantInactiveError,
  MerchantNotFoundError,
  MerchantUserMismatchError,
} from "../../merchant/error/merchant.errors.js";

// ── Mock external dependencies ─────────────────────────────────────
vi.mock("@payvo/database", () => ({
  db: {},
}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn(),
  hashKeySecret: vi.fn(),
}));

// ── Factories ──────────────────────────────────────────────────────
function createMockApiKeyRepo(
  overrides: Partial<ApiKeyRepository> = {},
): ApiKeyRepository {
  return {
    create: vi.fn(),
    scheduleRevoke: vi.fn(),
    findByMerchantIdForEnvironment: vi.fn(),
    ...overrides,
  } as unknown as ApiKeyRepository;
}

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

const inactiveMerchant: Merchant = {
  ...activeMerchant,
  isActive: false,
};

const fakeApiKey: ApiKey = {
  id: "apikey-1",
  merchantId: "merchant-1",
  secretHash: "hashed_secret",
  environment: "TEST",
  status: "ACTIVE",
  keyId: "key_test_abc123",
  lastUsedAt: null,
  scheduleRevokeAt: null,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("ApiKeyService.getMerchantActiveApiKey", () => {
  let apiKeyService: ApiKeyService;
  let apiKeyRepo: ReturnType<typeof createMockApiKeyRepo>;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(() => {
    merchantRepo = createMockMerchantRepo({
      findMerchantById: vi.fn().mockResolvedValue(activeMerchant),
    });
    apiKeyRepo = createMockApiKeyRepo({
      findByMerchantIdForEnvironment: vi.fn().mockResolvedValue(fakeApiKey),
    });

    apiKeyService = new ApiKeyService(apiKeyRepo, merchantRepo);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return the active api key for the merchant", async () => {
    const result = await apiKeyService.getMerchantActiveApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
    });

    expect(result.apiKey).toEqual(fakeApiKey);
  });

  it("should call findMerchantById with correct merchantId", async () => {
    await apiKeyService.getMerchantActiveApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
    });

    expect(merchantRepo.findMerchantById).toHaveBeenCalledWith("merchant-1");
  });

  it("should call findByMerchantIdForEnvironment with correct arguments", async () => {
    await apiKeyService.getMerchantActiveApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
    });

    expect(apiKeyRepo.findByMerchantIdForEnvironment).toHaveBeenCalledWith(
      "merchant-1",
      "TEST",
    );
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw MerchantNotFoundError when merchant does not exist", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(null);

    await expect(
      apiKeyService.getMerchantActiveApiKey({
        userId: "user-1",
        merchantId: "non-existent",
        environment: "TEST",
      }),
    ).rejects.toThrow(MerchantNotFoundError);
  });

  it("should throw MerchantUserMismatchError when userId does not match", async () => {
    await expect(
      apiKeyService.getMerchantActiveApiKey({
        userId: "different-user",
        merchantId: "merchant-1",
        environment: "TEST",
      }),
    ).rejects.toThrow(MerchantUserMismatchError);
  });

  it("should throw MerchantInactiveError when merchant is inactive", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(inactiveMerchant);

    await expect(
      apiKeyService.getMerchantActiveApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
      }),
    ).rejects.toThrow(MerchantInactiveError);
  });

  it("should throw ApiKeyNotFoundError when no active api key exists", async () => {
    vi.mocked(apiKeyRepo.findByMerchantIdForEnvironment).mockResolvedValue(null);

    await expect(
      apiKeyService.getMerchantActiveApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
      }),
    ).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("should throw ApiKeyNotFoundError with correct message when no key exists", async () => {
    vi.mocked(apiKeyRepo.findByMerchantIdForEnvironment).mockResolvedValue(null);

    await expect(
      apiKeyService.getMerchantActiveApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
      }),
    ).rejects.toThrow("No active api key is found for this merchant in TEST environment");
  });
});
