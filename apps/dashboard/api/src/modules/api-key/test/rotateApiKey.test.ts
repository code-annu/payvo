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
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn().mockReturnValue({
    keyId: "key_test_new123",
    keySecret: "new_secret_abc",
  }),
  hashKeySecret: vi.fn().mockReturnValue("hashed_new_secret"),
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

const revokedApiKey: ApiKey = {
  id: "apikey-old",
  merchantId: "merchant-1",
  secretHash: "old_hash",
  environment: "TEST",
  status: "REVOKED",
  keyId: "key_test_old",
  lastUsedAt: null,
  scheduleRevokeAt: now,
  revokedAt: now,
  createdAt: now,
  updatedAt: now,
};

const newApiKey: ApiKey = {
  id: "apikey-new",
  merchantId: "merchant-1",
  secretHash: "hashed_new_secret",
  environment: "TEST",
  status: "ACTIVE",
  keyId: "key_test_new123",
  lastUsedAt: null,
  scheduleRevokeAt: null,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("ApiKeyService.rotateApiKey", () => {
  let apiKeyService: ApiKeyService;
  let apiKeyRepo: ReturnType<typeof createMockApiKeyRepo>;
  let merchantRepo: ReturnType<typeof createMockMerchantRepo>;

  beforeEach(async () => {
    const { db } = await import("@payvo/database");

    merchantRepo = createMockMerchantRepo({
      findMerchantById: vi.fn().mockResolvedValue(activeMerchant),
    });
    apiKeyRepo = createMockApiKeyRepo({
      scheduleRevoke: vi.fn().mockResolvedValue(revokedApiKey),
      create: vi.fn().mockResolvedValue(newApiKey),
    });

    // Mock db.transaction to execute the callback with a fake tx
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const fakeTx = {};
      return cb(fakeTx);
    });

    apiKeyService = new ApiKeyService(apiKeyRepo, merchantRepo);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should rotate the api key and return new key with secret (IMMEDIATELY)", async () => {
    const result = await apiKeyService.rotateApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
      oldKeyRevokeStrategy: "IMMEDIATELY",
    });

    expect(result.apiKey).toEqual(newApiKey);
    expect(result.keySecret).toBe("new_secret_abc");
  });

  it("should rotate the api key and return new key with secret (24_HOURS)", async () => {
    const result = await apiKeyService.rotateApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
      oldKeyRevokeStrategy: "24_HOURS",
    });

    expect(result.apiKey).toEqual(newApiKey);
    expect(result.keySecret).toBe("new_secret_abc");
  });

  it("should call findMerchantById with correct merchantId", async () => {
    await apiKeyService.rotateApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
      oldKeyRevokeStrategy: "IMMEDIATELY",
    });

    expect(merchantRepo.findMerchantById).toHaveBeenCalledWith("merchant-1");
  });

  it("should call scheduleRevoke with revokeTime = now for IMMEDIATELY strategy", async () => {
    const before = new Date();
    await apiKeyService.rotateApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
      oldKeyRevokeStrategy: "IMMEDIATELY",
    });
    const after = new Date();

    const callArg = vi.mocked(apiKeyRepo.scheduleRevoke).mock.calls[0][0];
    expect(callArg.revokeTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(callArg.revokeTime.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should call scheduleRevoke with revokeTime ~24h in the future for 24_HOURS strategy", async () => {
    const before = Date.now() + 23 * 60 * 60 * 1000; // at least 23h from now
    await apiKeyService.rotateApiKey({
      userId: "user-1",
      merchantId: "merchant-1",
      environment: "TEST",
      oldKeyRevokeStrategy: "24_HOURS",
    });

    const callArg = vi.mocked(apiKeyRepo.scheduleRevoke).mock.calls[0][0];
    expect(callArg.revokeTime.getTime()).toBeGreaterThan(before);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw MerchantNotFoundError when merchant does not exist", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(null);

    await expect(
      apiKeyService.rotateApiKey({
        userId: "user-1",
        merchantId: "non-existent",
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toThrow(MerchantNotFoundError);
  });

  it("should throw MerchantUserMismatchError when userId does not match", async () => {
    await expect(
      apiKeyService.rotateApiKey({
        userId: "different-user",
        merchantId: "merchant-1",
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toThrow(MerchantUserMismatchError);
  });

  it("should throw MerchantInactiveError when merchant is inactive", async () => {
    vi.mocked(merchantRepo.findMerchantById).mockResolvedValue(inactiveMerchant);

    await expect(
      apiKeyService.rotateApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toThrow(MerchantInactiveError);
  });

  it("should throw ApiKeyNotFoundError when no active api key to rotate", async () => {
    vi.mocked(apiKeyRepo.scheduleRevoke).mockResolvedValue(null);

    await expect(
      apiKeyService.rotateApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("should throw ApiKeyNotFoundError with correct message when no active key", async () => {
    vi.mocked(apiKeyRepo.scheduleRevoke).mockResolvedValue(null);

    await expect(
      apiKeyService.rotateApiKey({
        userId: "user-1",
        merchantId: "merchant-1",
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toThrow(
      "No active api key is found for this merchant for TEST environment",
    );
  });
});
