import "reflect-metadata";
import type ApiKeyRepository from "../../modules/api-key/repository/api-key.repository.js";
import {
  ApiKeyInvalidError,
  ApiKeyRevokedError,
} from "../../modules/api-key/error/api-key.errors.js";
import { MerchantInactiveError } from "../../modules/merchant/error/merchant.errors.js";
import type { ValidateApiKeyDto } from "../dto/ValidateApiKeyDto.js";
import type { ApiKey } from "../../modules/api-key/entity/api-key.entity.js";

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InternalService.validateApiKey", () => {
  let internalService: InternalService;
  let apiKeyRepo: ApiKeyRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    apiKeyRepo = createMockApiKeyRepo();

    // Manually construct InternalService, bypassing inversify DI
    internalService = new (InternalService as any)(apiKeyRepo);
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
      ApiKeyInvalidError,
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
      ApiKeyInvalidError,
    );
  });

  // -----------------------------------------------------------------------
  // MerchantInactiveError – inactive merchant
  // -----------------------------------------------------------------------

  it("should throw MerchantInactiveError when the merchant is inactive", async () => {
    const keyWithInactiveMerchant: ApiKey = {
      ...fakeApiKey,
      merchant: { ...fakeApiKey.merchant, isActive: false },
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(keyWithInactiveMerchant);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      MerchantInactiveError,
    );
    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "This key belongs to inactive merchant",
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
      ApiKeyRevokedError,
    );
    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      "Revoked api key cannot be used to perform this action",
    );
  });

  // -----------------------------------------------------------------------
  // ApiKeyRevokedError – grace period expired
  // -----------------------------------------------------------------------

  it("should throw ApiKeyRevokedError when grace period has expired", async () => {
    const expiredGraceKey: ApiKey = {
      ...fakeApiKey,
      status: "GRACE_PERIOD",
      graceEndsAt: new Date("2020-01-01T00:00:00.000Z"), // in the past
    };
    vi.mocked(apiKeyRepo.findByKeyId).mockResolvedValue(expiredGraceKey);

    await expect(internalService.validateApiKey(validInput)).rejects.toThrow(
      ApiKeyRevokedError,
    );
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
      ApiKeyInvalidError,
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
