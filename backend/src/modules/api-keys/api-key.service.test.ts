import ApiKeyService from "./api-key.service";
import {
  ApiKeyAlreadyRevokedError,
  ApiKeyNotFoundError,
} from "./api-key.errors";
import {
  MerchantAccessDeniedError,
  MerchantNotFoundError,
} from "@/modules/merchant/merchant.errors";
import { ApiKey } from "./entity/api-key.entity";
import { Merchant } from "@/modules/merchant/entity/merchant.entity";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-21T12:00:00Z");

const mockMerchant: Merchant = {
  id: "merchant-1",
  userId: "user-1",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const mockApiKey: ApiKey = {
  id: "apikey-1",
  merchantId: "merchant-1",
  keyType: "SECRET",
  keyPrefix: "SECRET_TEST",
  keyHash: "hashed-key-value",
  keyValue: null,
  isActive: true,
  environment: "TEST",
  lastUsedAt: null,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Stub repositories / utils ────────────────────────────────────────
function createMocks() {
  return {
    apiKeyRepo: {
      create: vi.fn(),
      findById: vi.fn(),
      findByMerchantId: vi.fn(),
      revoke: vi.fn(),
      delete: vi.fn(),
    },
    merchantRepo: {
      findById: vi.fn(),
      findByUserId: vi.fn(),
    },
    apiKeyUtil: {
      generateApiKey: vi.fn(),
      hashApiKey: vi.fn(),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ApiKeyService(
    mocks.apiKeyRepo as any,
    mocks.merchantRepo as any,
    mocks.apiKeyUtil as any,
  );
}

// =====================================================================
// createApiKey
// =====================================================================
describe("ApiKeyService.createApiKey", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should create an API key and return it with the plaintext key value", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.apiKeyUtil.generateApiKey.mockReturnValue("SECRET_TEST_randomvalue123");
    mocks.apiKeyUtil.hashApiKey.mockReturnValue("hashed-key-value");
    mocks.apiKeyRepo.create.mockResolvedValue(mockApiKey);

    const result = await service.createApiKey("user-1", "merchant-1", {
      keyType: "SECRET",
      environment: "TEST",
    });

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.apiKeyUtil.generateApiKey).toHaveBeenCalledWith("SECRET", "TEST");
    expect(mocks.apiKeyUtil.hashApiKey).toHaveBeenCalledWith("SECRET_TEST_randomvalue123");
    expect(mocks.apiKeyRepo.create).toHaveBeenCalledWith({
      merchantId: "merchant-1",
      keyType: "SECRET",
      environment: "TEST",
      keyPrefix: "SECRET_TEST",
      keyHash: "hashed-key-value",
    });
    expect(result.apiKey.keyValue).toBe("SECRET_TEST_randomvalue123");
  });

  it("should throw MerchantNotFoundError if merchant does not exist", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.createApiKey("user-1", "non-existent", {
        keyType: "SECRET",
        environment: "TEST",
      }),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.apiKeyRepo.create).not.toHaveBeenCalled();
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.createApiKey("user-1", "merchant-1", {
        keyType: "SECRET",
        environment: "TEST",
      }),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.apiKeyRepo.create).not.toHaveBeenCalled();
  });
});

// =====================================================================
// getApiKey
// =====================================================================
describe("ApiKeyService.getApiKey", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return the API key when it exists and belongs to user's merchant", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);

    const result = await service.getApiKey("user-1", "apikey-1");

    expect(mocks.apiKeyRepo.findById).toHaveBeenCalledWith("apikey-1");
    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(result).toEqual({ apiKey: mockApiKey });
  });

  it("should throw ApiKeyNotFoundError if API key does not exist", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(null);

    await expect(
      service.getApiKey("user-1", "non-existent"),
    ).rejects.toThrow(ApiKeyNotFoundError);

    expect(mocks.merchantRepo.findById).not.toHaveBeenCalled();
  });

  it("should throw MerchantNotFoundError if associated merchant does not exist", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.getApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(MerchantNotFoundError);
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.getApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);
  });
});

// =====================================================================
// getMerchantApiKeys
// =====================================================================
describe("ApiKeyService.getMerchantApiKeys", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return all API keys for the merchant", async () => {
    const apiKeysList: ApiKey[] = [
      mockApiKey,
      {
        ...mockApiKey,
        id: "apikey-2",
        keyType: "PUBLISHABLE",
        keyPrefix: "PUBLISHABLE_TEST",
      },
    ];
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.apiKeyRepo.findByMerchantId.mockResolvedValue(apiKeysList);

    const result = await service.getMerchantApiKeys("user-1", "merchant-1");

    expect(mocks.merchantRepo.findById).toHaveBeenCalledWith("merchant-1");
    expect(mocks.apiKeyRepo.findByMerchantId).toHaveBeenCalledWith("merchant-1");
    expect(result).toEqual({ merchantId: "merchant-1", apiKeys: apiKeysList });
  });

  it("should return empty array if merchant has no API keys", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.apiKeyRepo.findByMerchantId.mockResolvedValue([]);

    const result = await service.getMerchantApiKeys("user-1", "merchant-1");

    expect(result).toEqual({ merchantId: "merchant-1", apiKeys: [] });
  });

  it("should throw MerchantNotFoundError if merchant does not exist", async () => {
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.getMerchantApiKeys("user-1", "non-existent"),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.apiKeyRepo.findByMerchantId).not.toHaveBeenCalled();
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.getMerchantApiKeys("user-1", "merchant-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.apiKeyRepo.findByMerchantId).not.toHaveBeenCalled();
  });
});

// =====================================================================
// revokeApiKey
// =====================================================================
describe("ApiKeyService.revokeApiKey", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should revoke an active API key and return it", async () => {
    const revokedKey = { ...mockApiKey, isActive: false, revokedAt: now };
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.apiKeyRepo.revoke.mockResolvedValue(revokedKey);

    const result = await service.revokeApiKey("user-1", "apikey-1");

    expect(mocks.apiKeyRepo.findById).toHaveBeenCalledWith("apikey-1");
    expect(mocks.apiKeyRepo.revoke).toHaveBeenCalledWith("apikey-1");
    expect(result).toEqual({ apiKey: revokedKey });
  });

  it("should throw ApiKeyNotFoundError if API key does not exist", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(null);

    await expect(
      service.revokeApiKey("user-1", "non-existent"),
    ).rejects.toThrow(ApiKeyNotFoundError);

    expect(mocks.apiKeyRepo.revoke).not.toHaveBeenCalled();
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.revokeApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.apiKeyRepo.revoke).not.toHaveBeenCalled();
  });

  it("should throw ApiKeyAlreadyRevokedError if key is already revoked", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue({
      ...mockApiKey,
      isActive: false,
      revokedAt: now,
    });
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);

    await expect(
      service.revokeApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(ApiKeyAlreadyRevokedError);

    expect(mocks.apiKeyRepo.revoke).not.toHaveBeenCalled();
  });

  it("should throw ApiKeyAlreadyRevokedError if key is inactive (isActive=false)", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue({
      ...mockApiKey,
      isActive: false,
      revokedAt: null,
    });
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);

    await expect(
      service.revokeApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(ApiKeyAlreadyRevokedError);

    expect(mocks.apiKeyRepo.revoke).not.toHaveBeenCalled();
  });
});

// =====================================================================
// deleteApiKey
// =====================================================================
describe("ApiKeyService.deleteApiKey", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should delete the API key when it exists and belongs to user's merchant", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue(mockMerchant);
    mocks.apiKeyRepo.delete.mockResolvedValue(mockApiKey);

    await service.deleteApiKey("user-1", "apikey-1");

    expect(mocks.apiKeyRepo.findById).toHaveBeenCalledWith("apikey-1");
    expect(mocks.apiKeyRepo.delete).toHaveBeenCalledWith("apikey-1");
  });

  it("should throw ApiKeyNotFoundError if API key does not exist", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteApiKey("user-1", "non-existent"),
    ).rejects.toThrow(ApiKeyNotFoundError);

    expect(mocks.apiKeyRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw MerchantNotFoundError if associated merchant does not exist", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(MerchantNotFoundError);

    expect(mocks.apiKeyRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw MerchantAccessDeniedError if merchant belongs to another user", async () => {
    mocks.apiKeyRepo.findById.mockResolvedValue(mockApiKey);
    mocks.merchantRepo.findById.mockResolvedValue({
      ...mockMerchant,
      userId: "different-user",
    });

    await expect(
      service.deleteApiKey("user-1", "apikey-1"),
    ).rejects.toThrow(MerchantAccessDeniedError);

    expect(mocks.apiKeyRepo.delete).not.toHaveBeenCalled();
  });
});
