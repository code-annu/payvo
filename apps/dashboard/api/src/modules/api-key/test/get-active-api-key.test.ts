import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import type MerchantRepository from "../../merchant/repository/merchant.repository.js";
import {
  MerchantNotFoundError,
  MerchantAccessDeniedError,
  MerchantInactiveError,
} from "../../merchant/error/merchant.errors.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import type { GetActiveApiKeyDto } from "../dto/GetActiveApiKeyDto.js";
import type { ApiKey } from "../entity/api-key.entity.js";
import type { Merchant } from "../../merchant/entity/merchant.entity.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeMerchant: Merchant = {
  id: "merchant-1",
  mid: "MID001",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const fakeApiKey: ApiKey = {
  id: "apikey-1",
  keyId: "pk_test_abc123",
  secretHash: "hashed-secret",
  environment: "TEST",
  status: "ACTIVE",
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: new Date("2026-09-09T12:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
  merchant: {
    id: "merchant-1",
    isActive: true,
    userId: "user-1",
  },
};

const getActiveInput: GetActiveApiKeyDto = {
  userId: "user-1",
  merchantId: "merchant-1",
  environment: "TEST",
};

// ---------------------------------------------------------------------------
// Helpers – create mock repository instances
// ---------------------------------------------------------------------------

function createMockApiKeyRepo(): ApiKeyRepository {
  return {
    create: vi.fn(),
    findActiveKey: vi.fn(),
    findById: vi.fn(),
    revokeKeyForRotation: vi.fn(),
  } as unknown as ApiKeyRepository;
}

function createMockMerchantRepo(): MerchantRepository {
  return {
    findById: vi.fn(),
    findByMid: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  } as unknown as MerchantRepository;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApiKeyService.getActiveApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    apiKeyRepo = createMockApiKeyRepo();
    merchantRepo = createMockMerchantRepo();

    service = new (ApiKeyService as any)(apiKeyRepo, merchantRepo);
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should return the active api key details on success", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
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

  it("should NOT return the secretHash in the response", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    const result = await service.getActiveApiKey(getActiveInput);

    expect(result).not.toHaveProperty("secretHash");
  });

  // -----------------------------------------------------------------------
  // Merchant validation
  // -----------------------------------------------------------------------

  it("should validate merchant ownership before looking up the key", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await service.getActiveApiKey(getActiveInput);

    expect(merchantRepo.findById).toHaveBeenCalledOnce();
    expect(merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
  });

  it("should throw MerchantNotFoundError when merchant does not exist", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      MerchantNotFoundError,
    );
  });

  it("should throw MerchantAccessDeniedError when userId does not match", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      userId: "other-user",
    });

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      MerchantAccessDeniedError,
    );
  });

  it("should throw MerchantInactiveError when merchant is inactive", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      MerchantInactiveError,
    );
  });

  it("should NOT look up the api key when merchant validation fails", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow();

    expect(apiKeyRepo.findActiveKey).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Key not found
  // -----------------------------------------------------------------------

  it("should throw ApiKeyNotFoundError when no active key exists", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      ApiKeyNotFoundError,
    );
  });

  it("should throw ApiKeyNotFoundError with descriptive message", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      "No active api key found for this merchant and environment",
    );
  });

  // -----------------------------------------------------------------------
  // Repository argument correctness
  // -----------------------------------------------------------------------

  it("should pass merchantId and environment to apiKeyRepo.findActiveKey", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await service.getActiveApiKey(getActiveInput);

    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledOnce();
    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "TEST",
    });
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by merchantRepo.findById", async () => {
    vi.mocked(merchantRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by apiKeyRepo.findActiveKey", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockRejectedValue(
      new Error("Query timeout"),
    );

    await expect(service.getActiveApiKey(getActiveInput)).rejects.toThrow(
      "Query timeout",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findById → findActiveKey", async () => {
    const callOrder: string[] = [];

    vi.mocked(merchantRepo.findById).mockImplementation(async () => {
      callOrder.push("findMerchant");
      return fakeMerchant;
    });
    vi.mocked(apiKeyRepo.findActiveKey).mockImplementation(async () => {
      callOrder.push("findActiveKey");
      return fakeApiKey;
    });

    await service.getActiveApiKey(getActiveInput);

    expect(callOrder).toEqual(["findMerchant", "findActiveKey"]);
  });

  // -----------------------------------------------------------------------
  // Edge case: LIVE environment
  // -----------------------------------------------------------------------

  it("should work correctly with LIVE environment", async () => {
    const liveInput: GetActiveApiKeyDto = {
      ...getActiveInput,
      environment: "LIVE",
    };
    const liveApiKey: ApiKey = {
      ...fakeApiKey,
      environment: "LIVE",
    };

    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(liveApiKey);

    const result = await service.getActiveApiKey(liveInput);

    expect(result.environment).toBe("LIVE");
    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "LIVE",
    });
  });
});
