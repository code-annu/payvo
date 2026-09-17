import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import { MerchantInactiveError, MerchantNotFoundError } from "../../merchant/error/merchant.errors.js";
import { ApiKeyAlreadyExistsError } from "../error/api-key.errors.js";
import type { GenerateApiKeyDto } from "../dto/GenerateApiKeyDto.js";
import type { ApiKey } from "../entity/api-key.entity.js";
import type { CachedMerchant } from "../../merchant/merchant-cache.service.js";

vi.mock("@payvo/database/client", () => ({
  client: {},
  dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/types", () => ({}));

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn().mockReturnValue({
    keyId: "pk_test_key-id-stub",
    keySecret: "sk_test_key-secret-stub",
  }),
  hashKeySecret: vi.fn().mockReturnValue("hashed-secret-stub"),
}));

import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import ApiKeyService from "../api-key.service.js";

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeMerchant: CachedMerchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
};

const fakeApiKey: ApiKey = {
  id: "apikey-1",
  keyId: "pk_test_key-id-stub",
  secretHash: "hashed-secret-stub",
  merchantId: "merchant-1",
  environment: "TEST",
  status: "ACTIVE",
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: now,
  updatedAt: now,
};

const generateInput: GenerateApiKeyDto = {
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

describe("ApiKeyService.generateMerchantApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantCacheService: ReturnType<typeof createMockMerchantCacheService>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiKeyRepo = createMockApiKeyRepo();
    merchantCacheService = createMockMerchantCacheService();
    service = new (ApiKeyService as any)(apiKeyRepo, merchantCacheService);
  });

  it("generates and returns a new API key on success", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    const result = await service.generateMerchantApiKey(generateInput);

    expect(result).toEqual({
      id: fakeApiKey.id,
      keyId: "pk_test_key-id-stub",
      keySecret: "sk_test_key-secret-stub",
      status: "ACTIVE",
      environment: "TEST",
      generatedAt: fakeApiKey.createdAt,
    });
  });

  it("validates the merchant before issuing a new key", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(merchantCacheService.getCachedMerchant).toHaveBeenCalledWith("merchant-1");
  });

  it("throws MerchantNotFoundError when the merchant is missing", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(null);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(MerchantNotFoundError);
  });

  it("throws MerchantInactiveError when the merchant is inactive", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(MerchantInactiveError);
  });

  it("throws ApiKeyAlreadyExistsError when an active key already exists", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(ApiKeyAlreadyExistsError);
  });

  it("generates a key using the provided environment and hashes the secret", async () => {
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(generateApiKey).toHaveBeenCalledWith("TEST");
    expect(hashKeySecret).toHaveBeenCalledWith("sk_test_key-secret-stub");
    expect(apiKeyRepo.create).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      keyId: "pk_test_key-id-stub",
      secretHash: "hashed-secret-stub",
      environment: "TEST",
    });
  });
});
