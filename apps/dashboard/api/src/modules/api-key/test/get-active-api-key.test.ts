import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import { MerchantInactiveError, MerchantNotFoundError } from "../../merchant/error/merchant.errors.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import type { GetActiveApiKeyDto } from "../dto/GetActiveApiKeyDto.js";
import type { ApiKey } from "../entity/api-key.entity.js";
import type { CachedMerchant } from "../../merchant/merchant-cache.service.js";

vi.mock("@payvo/database/client", () => ({
  client: {},
  dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/types", () => ({}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn(),
  hashKeySecret: vi.fn(),
}));

import ApiKeyService from "../api-key.service.js";

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeMerchant: CachedMerchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
};

const fakeApiKey: ApiKey = {
  id: "apikey-1",
  keyId: "pk_test_abc123",
  secretHash: "hashed-secret",
  merchantId: "merchant-1",
  environment: "TEST",
  status: "ACTIVE",
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: new Date("2026-09-09T12:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
};

const getActiveInput: GetActiveApiKeyDto = {
  userId: "user-1",
  merchantId: "merchant-1",
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

describe("ApiKeyService.getActiveApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantCacheService: ReturnType<typeof createMockMerchantCacheService>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiKeyRepo = createMockApiKeyRepo();
    merchantCacheService = createMockMerchantCacheService();
    service = new (ApiKeyService as any)(apiKeyRepo, merchantCacheService);
  });

  it("returns the active API key details for the merchant and environment", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    const result = await service.getActiveApiKey(getActiveInput);

    expect(result).toEqual({
      id: fakeApiKey.id,
      keyId: fakeApiKey.keyId,
      status: "ACTIVE",
      environment: "TEST",
      lastUsedAt: fakeApiKey.lastUsedAt,
      createdAt: fakeApiKey.createdAt,
    });
  });

  it("validates the merchant before querying the active key", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await service.getActiveApiKey(getActiveInput);

    expect(merchantCacheService.getCachedMerchant).toHaveBeenCalledWith("merchant-1");
  });

  it("throws MerchantNotFoundError when the merchant cannot be resolved", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(MerchantNotFoundError);
  });

  it("throws MerchantInactiveError when the merchant is inactive", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(MerchantInactiveError);
  });

  it("throws ApiKeyNotFoundError when no active key is found", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("passes the merchantId and environment to findActiveKey", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await service.getActiveApiKey(getActiveInput);

    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "TEST",
    });
  });
});
