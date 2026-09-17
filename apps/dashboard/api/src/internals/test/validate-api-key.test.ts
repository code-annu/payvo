import "reflect-metadata";
import type ApiKeyRepository from "../../modules/api-key/repository/api-key.repository.js";
import {
  InvalidApiKeyCredentialsError,
  RevokedApiKeyError,
} from "../../modules/api-key/error/api-key.errors.js";
import type { ValidateApiKeyDto } from "../dto/ValidateApiKeyDto.js";
import type { ApiKey } from "../../modules/api-key/entity/api-key.entity.js";
import type MerchantCacheService from "../../modules/merchant/merchant-cache.service.js";
import type UserCacheService from "../../modules/user/user-cache.service.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
}));

vi.mock("@payvo/database/types", () => ({}));

// ---------------------------------------------------------------------------
// Mock external shared packages
// ---------------------------------------------------------------------------

vi.mock("@payvo/shared/api-key", () => ({
  hashKeySecret: vi.fn().mockReturnValue("hashed-secret-stub"),
  generateApiKey: vi.fn(),
}));

// Re-import mocked modules so we can assert against them
import { hashKeySecret } from "@payvo/shared/api-key";
import InternalService from "../internal.service.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeApiKey: ApiKey = {
  id: "apikey-1",
  keyId: "test_key_abc123",
  secretHash: "hashed-secret-stub",
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

const validInput: ValidateApiKeyDto = {
  keyId: "test_key_abc123",
  keySecret: "raw-secret-value",
};

// ---------------------------------------------------------------------------
// Helpers – create mock repository instance
// ---------------------------------------------------------------------------

function createMockApiKeyRepo(): ApiKeyRepository {
  return {
    findById: vi.fn(),
    findByKeyId: vi.fn(),
    create: vi.fn(),
    findActiveKey: vi.fn(),
    revokeKeyForRotation: vi.fn(),
  } as unknown as ApiKeyRepository;
}

function createMockMerchantCacheService(): MerchantCacheService {
  return {
    getCachedMerchant: vi.fn(),
    invalidateCachedMerchant: vi.fn(),
  } as unknown as MerchantCacheService;
}

function createMockUserCacheService(): UserCacheService {
  return {
    getCachedUser: vi.fn(),
    invalidateCachedUser: vi.fn(),
  } as unknown as UserCacheService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InternalService.validateApiKey", () => {
  let internalService: InternalService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantCacheService: MerchantCacheService;
  let userCacheService: UserCacheService;

  beforeEach(() => {
    vi.clearAllMocks();

    apiKeyRepo = createMockApiKeyRepo();
    merchantCacheService = createMockMerchantCacheService();
    userCacheService = createMockUserCacheService();
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue({
      id: "merchant-1",
      userId: "user-1",
      isActive: true,
    });
    vi.mocked(userCacheService.getCachedUser).mockResolvedValue({
      id: "user-1",
      deletedAt: null,
    });

    // Manually construct InternalService, bypassing inversify DI
    internalService = new (InternalService as any)(
      apiKeyRepo,
      userCacheService,
      merchantCacheService,
    );
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should return the api key on successful validation", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(fakeApiKey);

    const result = await internalService.validateApiKey(validInput);

    expect(result).toEqual(fakeApiKey);
  });

  // -----------------------------------------------------------------------
  // API key lookup
  // -----------------------------------------------------------------------

  it("should look up the api key by keyId", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(fakeApiKey);

    await internalService.validateApiKey(validInput);

    expect(apiKeyRepo.findByKeyId).toHaveBeenCalledOnce();
    expect(apiKeyRepo.findByKeyId).toHaveBeenCalledWith(validInput.keyId);
  });

  // -----------------------------------------------------------------------
  // Secret hashing
  // -----------------------------------------------------------------------

  it("should hash the keySecret using hashKeySecret", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(fakeApiKey);

    await internalService.validateApiKey(validInput);

    expect(hashKeySecret).toHaveBeenCalledOnce();
    expect(hashKeySecret).toHaveBeenCalledWith(validInput.keySecret);
  });

  // -----------------------------------------------------------------------
  // ApiKeyInvalidError – key not found
  // -----------------------------------------------------------------------

  it("should throw ApiKeyInvalidError when no api key is found for the keyId", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(null);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      InvalidApiKeyCredentialsError,
    );
    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "Invalid API key id or secret",
    );
  });

  // -----------------------------------------------------------------------
  // ApiKeyInvalidError – wrong secret
  // -----------------------------------------------------------------------

  it("should throw ApiKeyInvalidError when secret hash does not match", async () => {
    const keyWithDifferentHash: ApiKey = {
      ...fakeApiKey,
      secretHash: "different-hash",
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(keyWithDifferentHash);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      InvalidApiKeyCredentialsError,
    );
  });

  // -----------------------------------------------------------------------
  // InvalidApiKeyCredentialsError – inactive merchant
  // -----------------------------------------------------------------------

  it("should throw InvalidApiKeyCredentialsError when the merchant is inactive", async () => {
    const keyWithInactiveMerchant: ApiKey = {
      ...fakeApiKey,
      merchant: { ...fakeApiKey.merchant, isActive: false },
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(
      keyWithInactiveMerchant,
    );
    vi.mocked(merchantCacheService.getCachedMerchant).mockResolvedValue({
      id: "merchant-1",
      userId: "user-1",
      isActive: false,
    });

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      InvalidApiKeyCredentialsError,
    );
    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "Api key is associated with inactive or deleted merchant",
    );
  });

  // -----------------------------------------------------------------------
  // ApiKeyRevokedError – status REVOKED
  // -----------------------------------------------------------------------

  it("should throw ApiKeyRevokedError when api key status is REVOKED", async () => {
    const revokedKey: ApiKey = {
      ...fakeApiKey,
      status: "REVOKED",
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(revokedKey);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      RevokedApiKeyError,
    );
    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "Api key is revoked",
    );
  });

  // -----------------------------------------------------------------------
  // Grace period status is accepted by the current validator
  // -----------------------------------------------------------------------

  it("should return the api key when grace period has expired", async () => {
    const expiredGraceKey: ApiKey = {
      ...fakeApiKey,
      status: "GRACE_PERIOD",
      graceEndsAt: new Date("2020-01-01T00:00:00.000Z"), // in the past
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(expiredGraceKey);

    const result = await internalService.validateApiKey(validInput);

    expect(result).toEqual(expiredGraceKey);
  });

  // -----------------------------------------------------------------------
  // Grace period still active – should NOT throw
  // -----------------------------------------------------------------------

  it("should return the api key when grace period has NOT expired yet", async () => {
    const futureGraceKey: ApiKey = {
      ...fakeApiKey,
      status: "GRACE_PERIOD",
      graceEndsAt: new Date("2099-01-01T00:00:00.000Z"), // far in the future
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(futureGraceKey);

    const result = await internalService.validateApiKey(validInput);

    expect(result).toEqual(futureGraceKey);
  });

  // -----------------------------------------------------------------------
  // Error priority: invalid check before merchant/revoked checks
  // -----------------------------------------------------------------------

  it("should NOT check merchant or revoked status when key is not found", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(null);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      InvalidApiKeyCredentialsError,
    );
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by apiKeyRepo.findByKeyId", async () => {
    vi.mocked(apiKeyRepo.findByKeyId).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findByKeyId → hashKeySecret", async () => {
    const callOrder: string[] = [];

    vi.mocked(apiKeyRepo.findByKeyId).mockImplementation(async () => {
      callOrder.push("findByKeyId");
      return fakeApiKey;
    });
    vi.mocked(hashKeySecret).mockImplementation(() => {
      callOrder.push("hashKeySecret");
      return "hashed-secret-stub";
    });

    await internalService.validateApiKey(validInput);

    expect(callOrder).toEqual(["findByKeyId", "hashKeySecret"]);
  });
});
