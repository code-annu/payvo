import "reflect-metadata";
import type ApiKeyRepository from "../repository/api-key.repository.js";
import type MerchantRepository from "../../merchant/repository/merchant.repository.js";
import {
  MerchantNotFoundError,
  MerchantAccessDeniedError,
  MerchantInactiveError,
} from "../../merchant/error/merchant.errors.js";
import {
  ApiKeyAlreadyExistsError,
} from "../error/api-key.errors.js";
import type { GenerateApiKeyDto } from "../dto/GenerateApiKeyDto.js";
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
    keyId: "pk_test_key-id-stub",
    keySecret: "sk_test_key-secret-stub",
  }),
  hashKeySecret: vi.fn().mockReturnValue("hashed-secret-stub"),
}));

// Re-import mocked modules so we can assert against them
import { generateApiKey, hashKeySecret } from "@payvo/shared/api-key";
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
  keyId: "pk_test_key-id-stub",
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

const generateInput: GenerateApiKeyDto = {
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

describe("ApiKeyService.generateMerchantApiKey", () => {
  let service: ApiKeyService;
  let apiKeyRepo: ApiKeyRepository;
  let merchantRepo: MerchantRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    apiKeyRepo = createMockApiKeyRepo();
    merchantRepo = createMockMerchantRepo();

    // Manually construct ApiKeyService, bypassing inversify DI
    service = new (ApiKeyService as any)(apiKeyRepo, merchantRepo);
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should generate and return a new api key on success", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
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

  // -----------------------------------------------------------------------
  // Merchant validation
  // -----------------------------------------------------------------------

  it("should call merchantRepo.findById with the correct merchantId", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(merchantRepo.findById).toHaveBeenCalledOnce();
    expect(merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
  });

  it("should throw MerchantNotFoundError when merchant does not exist", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      MerchantNotFoundError,
    );
  });

  it("should throw MerchantAccessDeniedError when userId does not match merchant owner", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      userId: "other-user",
    });

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      MerchantAccessDeniedError,
    );
  });

  it("should throw MerchantInactiveError when merchant is inactive", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue({
      ...fakeMerchant,
      isActive: false,
    });

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      MerchantInactiveError,
    );
  });

  it("should NOT create an api key when merchant validation fails", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(null);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow();

    expect(apiKeyRepo.findActiveKey).not.toHaveBeenCalled();
    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Duplicate key check
  // -----------------------------------------------------------------------

  it("should check for an existing active key for the merchant and environment", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledOnce();
    expect(apiKeyRepo.findActiveKey).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      environment: "TEST",
    });
  });

  it("should throw ApiKeyAlreadyExistsError when an active key already exists", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      ApiKeyAlreadyExistsError,
    );
  });

  it("should NOT create a new key when an active key already exists", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(fakeApiKey);

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow();

    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Crypto operations
  // -----------------------------------------------------------------------

  it("should call generateApiKey with the correct environment", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(generateApiKey).toHaveBeenCalledOnce();
    expect(generateApiKey).toHaveBeenCalledWith("TEST");
  });

  it("should hash the key secret before persisting", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(hashKeySecret).toHaveBeenCalledOnce();
    expect(hashKeySecret).toHaveBeenCalledWith("sk_test_key-secret-stub");
  });

  it("should pass the hashed secret (not plaintext) to apiKeyRepo.create", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    await service.generateMerchantApiKey(generateInput);

    expect(apiKeyRepo.create).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      keyId: "pk_test_key-id-stub",
      secretHash: "hashed-secret-stub",
      environment: "TEST",
    });
  });

  // -----------------------------------------------------------------------
  // Return value structure
  // -----------------------------------------------------------------------

  it("should return the raw keySecret (not the hash)", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockResolvedValue(fakeApiKey);

    const result = await service.generateMerchantApiKey(generateInput);

    expect(result.keySecret).toBe("sk_test_key-secret-stub");
    expect(result.keySecret).not.toBe("hashed-secret-stub");
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by merchantRepo.findById", async () => {
    vi.mocked(merchantRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by apiKeyRepo.findActiveKey", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockRejectedValue(
      new Error("Query failed"),
    );

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      "Query failed",
    );
  });

  it("should propagate errors thrown by apiKeyRepo.create", async () => {
    vi.mocked(merchantRepo.findById).mockResolvedValue(fakeMerchant);
    vi.mocked(apiKeyRepo.findActiveKey).mockResolvedValue(null);
    vi.mocked(apiKeyRepo.create).mockRejectedValue(
      new Error("Insert failed"),
    );

    await expect(service.generateMerchantApiKey(generateInput)).rejects.toThrow(
      "Insert failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findById → findActiveKey → generateApiKey → hashKeySecret → create", async () => {
    const callOrder: string[] = [];

    vi.mocked(merchantRepo.findById).mockImplementation(async () => {
      callOrder.push("findMerchant");
      return fakeMerchant;
    });
    vi.mocked(apiKeyRepo.findActiveKey).mockImplementation(async () => {
      callOrder.push("findActiveKey");
      return null;
    });
    vi.mocked(generateApiKey).mockImplementation(() => {
      callOrder.push("generateApiKey");
      return { keyId: "pk_test_key-id-stub", keySecret: "sk_test_key-secret-stub" };
    });
    vi.mocked(hashKeySecret).mockImplementation(() => {
      callOrder.push("hashKeySecret");
      return "hashed-secret-stub";
    });
    vi.mocked(apiKeyRepo.create).mockImplementation(async () => {
      callOrder.push("createApiKey");
      return fakeApiKey;
    });

    await service.generateMerchantApiKey(generateInput);

    expect(callOrder).toEqual([
      "findMerchant",
      "findActiveKey",
      "generateApiKey",
      "hashKeySecret",
      "createApiKey",
    ]);
  });
});
