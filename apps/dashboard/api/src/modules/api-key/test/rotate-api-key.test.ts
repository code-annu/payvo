import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import { MerchantInactiveError, MerchantNotFoundError } from "../../merchant/error/merchant.errors.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import type { RotateApiKeyDto } from "../dto/RotateApiKeyDto.js";
import type { ApiKey } from "../entity/api-key.entity.js";
import type { CachedMerchant } from "../../merchant/merchant-cache.service.js";

vi.mock("@payvo/database/client", () => ({
  client: {},
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock("@payvo/database/types", () => ({}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn().mockReturnValue({
    keyId: "pk_test_new-key-id",
    keySecret: "sk_test_new-key-secret",
  }),
  hashKeySecret: vi.fn().mockReturnValue("hashed-new-secret"),
}));

import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { dbTransaction } from "@payvo/database/client";
import ApiKeyService from "../api-key.service.js";

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeMerchant: CachedMerchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
};

const existingActiveKey: ApiKey = {
  id: "apikey-old",
  keyId: "pk_test_old-key",
  secretHash: "hashed-old-secret",
  environment: "TEST",
  status: "ACTIVE",
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: now,
  updatedAt: now,
  merchant: {
    id: "merchant-1",
    isActive: true,
    userId: "user-1",
  },
};

const newApiKey: ApiKey = {
  id: "apikey-new",
  keyId: "pk_test_new-key-id",
  secretHash: "hashed-new-secret",
  environment: "TEST",
  status: "ACTIVE",
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: now,
  updatedAt: now,
  merchant: {
    id: "merchant-1",
    isActive: true,
    userId: "user-1",
  },
};

const rotateInputImmediate: RotateApiKeyDto = {
  userId: "user-1",
  merchantId: "merchant-1",
  oldKeyRevokeStrategy: "IMMEDIATELY",
  environment: "TEST",
};

const rotateInput24h: RotateApiKeyDto = {
  userId: "user-1",
  merchantId: "merchant-1",
  oldKeyRevokeStrategy: "24_HOURS",
  environment: "TEST",
};

function createMockApiKeyRepo(): ApiKeyRepository {
  return {
    create: vi.fn(),
    findActiveKey: vi.fn(),
    findById: vi.fn(),
    revokeKeyForRotation: vi.fn(),
  } as unknown as ApiKeyRepository;
}

function createMockMerchantCacheService() {
  return {
    getCachedMerchant: vi.fn(),
    invalidateCachedMerchant: vi.fn(),
  };
}

describe("ApiKeyService.rotateApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantCacheService: ReturnType<typeof createMockMerchantCacheService>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiKeyRepo = createMockApiKeyRepo();
    merchantCacheService = createMockMerchantCacheService();
    service = new (ApiKeyService as any)(apiKeyRepo, merchantCacheService);
  });

  it("rotates the key and returns the new key metadata", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    const result = await service.rotateApiKey(rotateInputImmediate);

    expect(result).toEqual({
      id: newApiKey.id,
      keyId: "pk_test_new-key-id",
      keySecret: "sk_test_new-key-secret",
      status: "ACTIVE",
      environment: "TEST",
      generatedAt: newApiKey.createdAt,
    });
  });

  it("validates the merchant before rotating the key", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(merchantCacheService.getCachedMerchant).toHaveBeenCalledWith("merchant-1");
  });

  it("throws MerchantNotFoundError when the merchant is missing", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(null);

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(MerchantNotFoundError);
  });

  it("throws MerchantInactiveError when the merchant is inactive", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(MerchantInactiveError);
  });

  it("revokes the old key immediately when the strategy is IMMEDIATELY", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    const revokeCall = vi.mocked(apiKeyRepo.revokeKeyForRotation).mock.calls[0]![1] as {
      merchantId: string;
      revokeAt: Date;
    };
    expect(revokeCall.merchantId).toBe("merchant-1");
    expect(revokeCall.revokeAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("sets the revoke time to 24 hours in the future for the 24_HOURS strategy", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInput24h);

    const revokeCall = vi.mocked(apiKeyRepo.revokeKeyForRotation).mock.calls[0]![1] as {
      revokeAt: Date;
    };
    const diffHours = (revokeCall.revokeAt.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThanOrEqual(24.01);
  });

  it("generates a new key with the same environment and hashes the secret", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(generateApiKey).toHaveBeenCalledWith("TEST");
    expect(hashKeySecret).toHaveBeenCalledWith("sk_test_new-key-secret");
    expect(apiKeyRepo.create).toHaveBeenCalledWith(
      { merchantId: "merchant-1", keyId: "pk_test_new-key-id", secretHash: "hashed-new-secret", environment: "TEST" },
      expect.anything(),
    );
  });

  it("throws ApiKeyNotFoundError when no active key can be revoked", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("runs revoke and create inside the transaction callback", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(existingActiveKey);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(dbTransaction).toHaveBeenCalledTimes(1);
    expect(apiKeyRepo.revokeKeyForRotation).toHaveBeenCalledTimes(1);
    expect(apiKeyRepo.create).toHaveBeenCalledTimes(1);
  });
});
