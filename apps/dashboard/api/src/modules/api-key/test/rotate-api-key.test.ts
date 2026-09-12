import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import type MerchantRepository from "../../merchant/repository/merchant.repository.js";
import {
  MerchantNotFoundError,
  MerchantAccessDeniedError,
  MerchantInactiveError,
} from "../../merchant/error/merchant.errors.js";
import { ApiKeyNotFoundError } from "../error/api-key.errors.js";
import type { RotateApiKeyDto } from "../dto/RotateApiKeyDto.js";
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

// ---------------------------------------------------------------------------
// Mock external shared packages
// ---------------------------------------------------------------------------

vi.mock("@payvo/shared/api-key", () => ({
  generateApiKey: vi.fn().mockReturnValue({
    keyId: "pk_test_new-key-id",
    keySecret: "sk_test_new-key-secret",
  }),
  hashKeySecret: vi.fn().mockReturnValue("hashed-new-secret"),
}));

// Re-import mocked modules so we can assert against them
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
import { dbTransaction } from "@payvo/database/client";
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
  apiKeyId: "apikey-old",
  oldKeyRevokeStrategy: "IMMEDIATELY",
};

const rotateInput24h: RotateApiKeyDto = {
  userId: "user-1",
  apiKeyId: "apikey-old",
  oldKeyRevokeStrategy: "24_HOURS",
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

describe("ApiKeyService.rotateApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    apiKeyRepo = createMockApiKeyRepo();
    merchantRepo = createMockMerchantRepo();

    service = new (ApiKeyService as any)(apiKeyRepo, merchantRepo);

    // Default dbTransaction mock: executes the callback with a fake tx
    vi.mocked(dbTransaction).mockImplementation(async (cb: any) => {
      const fakeTx = {};
      return cb(fakeTx);
    });
  });

  // -----------------------------------------------------------------------
  // Happy path – IMMEDIATELY
  // -----------------------------------------------------------------------

  it("should rotate the api key and return the new key with IMMEDIATELY strategy", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
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

  // -----------------------------------------------------------------------
  // Happy path – 24_HOURS
  // -----------------------------------------------------------------------

  it("should rotate the api key with 24_HOURS strategy", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    const result = await service.rotateApiKey(rotateInput24h);

    expect(result).toEqual({
      id: newApiKey.id,
      keyId: "pk_test_new-key-id",
      keySecret: "sk_test_new-key-secret",
      status: "ACTIVE",
      environment: "TEST",
      generatedAt: newApiKey.createdAt,
    });
  });

  it("should set revokeAt to approximately now for IMMEDIATELY strategy", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    const before = new Date();
    await service.rotateApiKey(rotateInputImmediate);
    const after = new Date();

    const revokeCall = vi.mocked(apiKeyRepo.revokeKeyForRotation).mock.calls[0]!;
    const revokeAt = revokeCall[1].revokeAt as Date;

    expect(revokeAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(revokeAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should set revokeAt to approximately 24 hours from now for 24_HOURS strategy", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    const before = new Date();
    await service.rotateApiKey(rotateInput24h);

    const revokeCall = vi.mocked(apiKeyRepo.revokeKeyForRotation).mock.calls[0]!;
    const revokeAt = revokeCall[1].revokeAt as Date;
    const diffHours =
      (revokeAt.getTime() - before.getTime()) / (1000 * 60 * 60);

    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThanOrEqual(24.01);
  });

  // -----------------------------------------------------------------------
  // Api key validation
  // -----------------------------------------------------------------------

  it("should look up the existing key by apiKeyId", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(apiKeyRepo.findById).toHaveBeenCalledOnce();
    expect(apiKeyRepo.findById).toHaveBeenCalledWith("apikey-old");
  });

  it("should throw ApiKeyNotFoundError when key does not exist", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(null);

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      ApiKeyNotFoundError,
    );
  });

  it("should throw ApiKeyNotFoundError when key status is not ACTIVE", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue({
      ...existingActiveKey,
      status: "REVOKED",
    });

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      ApiKeyNotFoundError,
    );
    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      "Only active api keys can be rotated",
    );
  });

  it("should throw ApiKeyNotFoundError when key is in GRACE_PERIOD", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue({
      ...existingActiveKey,
      status: "GRACE_PERIOD",
    });

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      ApiKeyNotFoundError,
    );
  });

  // -----------------------------------------------------------------------
  // Merchant validation
  // -----------------------------------------------------------------------

  it("should validate merchant ownership using the key's merchant id", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(merchantRepo.findById).toHaveBeenCalledOnce();
    expect(merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
  });

  it("should throw MerchantNotFoundError when the key's merchant does not exist", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      MerchantNotFoundError,
    );
  });

  it("should throw MerchantAccessDeniedError when userId does not match merchant owner", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      userId: "other-user",
    });

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      MerchantAccessDeniedError,
    );
  });

  it("should throw MerchantInactiveError when merchant is inactive", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      MerchantInactiveError,
    );
  });

  it("should NOT start transaction when merchant validation fails", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow();

    expect(dbTransaction).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Transaction behavior
  // -----------------------------------------------------------------------

  it("should run revoke and create inside dbTransaction", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(apiKeyRepo.revokeKeyForRotation).toHaveBeenCalledOnce();
    expect(apiKeyRepo.create).toHaveBeenCalledOnce();
  });

  it("should pass the old key id to revokeKeyForRotation", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    const revokeCall = vi.mocked(apiKeyRepo.revokeKeyForRotation).mock.calls[0]!;
    expect(revokeCall[1].id).toBe("apikey-old");
  });

  // -----------------------------------------------------------------------
  // Crypto operations
  // -----------------------------------------------------------------------

  it("should generate a new key with the same environment as the old key", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(generateApiKey).toHaveBeenCalledOnce();
    expect(generateApiKey).toHaveBeenCalledWith("TEST");
  });

  it("should hash the new key secret", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    await service.rotateApiKey(rotateInputImmediate);

    expect(hashKeySecret).toHaveBeenCalledOnce();
    expect(hashKeySecret).toHaveBeenCalledWith("sk_test_new-key-secret");
  });

  // -----------------------------------------------------------------------
  // Return value
  // -----------------------------------------------------------------------

  it("should return the raw keySecret of the new key (not the hash)", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(newApiKey);

    const result = await service.rotateApiKey(rotateInputImmediate);

    expect(result.keySecret).toBe("sk_test_new-key-secret");
    expect(result.keySecret).not.toBe("hashed-new-secret");
  });

  // -----------------------------------------------------------------------
  // Propagation of errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by apiKeyRepo.findById", async () => {
    vi.mocked(apiKeyRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown during the transaction", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(dbTransaction).mockRejectedValue(
      new Error("Transaction aborted"),
    );

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      "Transaction aborted",
    );
  });

  it("should propagate errors thrown by apiKeyRepo.revokeKeyForRotation inside transaction", async () => {
    vi.mocked(apiKeyRepo.findById).mockResolvedValue(existingActiveKey);
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockRejectedValue(
      new Error("Revoke failed"),
    );

    await expect(service.rotateApiKey(rotateInputImmediate)).rejects.toThrow(
      "Revoke failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findById → findMerchant → dbTransaction(revoke → create)", async () => {
    const callOrder: string[] = [];

    vi.mocked(apiKeyRepo.findById).mockImplementation(async () => {
      callOrder.push("findApiKey");
      return existingActiveKey;
    });
    vi.mocked(merchantRepo.findById).mockImplementation(async () => {
      callOrder.push("findMerchant");
      return fakeMerchant;
    });
    vi.mocked(dbTransaction).mockImplementation(async (cb: any) => {
      callOrder.push("dbTransaction");
      const fakeTx = {};
      return cb(fakeTx);
    });
    vi.mocked(apiKeyRepo.revokeKeyForRotation).mockImplementation(async () => {
      callOrder.push("revokeKey");
      return null;
    });
    vi.mocked(apiKeyRepo.create).mockImplementation(async () => {
      callOrder.push("createKey");
      return newApiKey;
    });
    vi.mocked(generateApiKey).mockReturnValue({
      keyId: "pk_test_new-key-id",
      keySecret: "sk_test_new-key-secret",
    });
    vi.mocked(hashKeySecret).mockReturnValue("hashed-new-secret");

    await service.rotateApiKey(rotateInputImmediate);

    expect(callOrder).toEqual([
      "findApiKey",
      "findMerchant",
      "dbTransaction",
      "revokeKey",
      "createKey",
    ]);
  });
});
