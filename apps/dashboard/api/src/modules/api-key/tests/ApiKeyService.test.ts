import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
  type Merchant,
} from "@payvo/database/types";
import { dbTransaction, type TransactionClient } from "@payvo/database/client";
import { hashKeySecret } from "@payvo/shared/api-key";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantContract } from "@/modules/merchant/contract/merchant.contract.js";
import ApiKeyService from "../application/service/api-key.service.js";
import * as apiKeyErrors from "../error/api-key.errors.js";
import ApiKeyMapper from "../mapper/api-key.mapper.js";
import ApiKeyRepository from "../repository/api-key.repository.js";

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

const userId = "02b6e011-cb0f-4472-8d85-9b6332028a30";
const merchantId = "13d84e90-646d-42b8-8ba2-441338db58f6";
const transactionClient = {} as TransactionClient;
const merchant: Merchant = {
  id: merchantId,
  userId,
  mid: "merchant123",
  status: MerchantStatus.ACTIVE,
  closedAt: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};
const apiKey = {
  id: "c978959f-389b-4ce3-a248-94244f30e606",
  merchantId,
  keyId: "pvo_test_existing",
  secretHash: "stored-hash",
  environment: ApiKeyEnvironment.TEST,
  status: ApiKeyStatus.ACTIVE,
  graceEndsAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

function createServiceTestContext() {
  const repository = new ApiKeyRepository();
  const findActiveKey = vi
    .spyOn(repository, "findActiveKey")
    .mockResolvedValue(null);
  const findByMerchantId = vi
    .spyOn(repository, "findByMerchantId")
    .mockResolvedValue([]);
  const findByMerchantAndKeyId = vi
    .spyOn(repository, "findByMerchantAndKeyId")
    .mockResolvedValue(null);
  const create = vi
    .spyOn(repository, "create")
    .mockImplementation(async (data) => ({
      ...apiKey,
      merchantId: data.merchantId,
      keyId: data.keyId,
      secretHash: data.secretHash,
      environment: data.environment,
      status: data.status,
    }));
  const revokeKeyForRotation = vi
    .spyOn(repository, "revokeKeyForRotation")
    .mockResolvedValue(apiKey);
  const revokeKey = vi.spyOn(repository, "revokeKey").mockResolvedValue(apiKey);
  const revokeAllByUserId = vi
    .spyOn(repository, "revokeAllByUserId")
    .mockResolvedValue();
  const merchantContract: MerchantContract = {
    getActiveMerchantOwnedByUser: vi.fn().mockResolvedValue(merchant),
    closeUserMerchants: vi.fn(async () => {}),
  };
  const getActiveMerchantOwnedByUser = vi.mocked(
    merchantContract.getActiveMerchantOwnedByUser,
  );

  return {
    service: new ApiKeyService(
      repository,
      new ApiKeyMapper(),
      merchantContract,
    ),
    findActiveKey,
    findByMerchantId,
    findByMerchantAndKeyId,
    create,
    revokeKeyForRotation,
    revokeKey,
    revokeAllByUserId,
    getActiveMerchantOwnedByUser,
  };
}

describe("ApiKeyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbTransaction).mockImplementation((callback) =>
      callback(transactionClient),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates an API key for an owned merchant and stores only its secret hash", async () => {
    const context = createServiceTestContext();

    const result = await context.service.generateApiKey(userId, {
      merchantId,
      environment: ApiKeyEnvironment.TEST,
    });

    expect(context.getActiveMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
    );
    expect(context.findActiveKey).toHaveBeenCalledWith({
      merchantId,
      environment: ApiKeyEnvironment.TEST,
    });
    expect(result).toMatchObject({
      apiKey: {
        id: apiKey.id,
        merchantId,
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
        keyId: expect.stringMatching(/^pvo_test_[A-Za-z0-9_-]+$/),
      },
      keySecret: expect.any(String),
    });

    const { keySecret } = result;
    if (typeof keySecret !== "string") {
      throw new Error("Generated API key response is missing its secret");
    }

    expect(context.create).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId,
        keyId: result.apiKey.keyId,
        secretHash: hashKeySecret(keySecret),
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
      }),
    );
  });

  it("rejects generating a second active key for the same merchant and environment", async () => {
    const context = createServiceTestContext();
    context.findActiveKey.mockResolvedValue(apiKey);

    await expect(
      context.service.generateApiKey(userId, {
        merchantId,
        environment: ApiKeyEnvironment.TEST,
      }),
    ).rejects.toBeInstanceOf(apiKeyErrors.ApiKeyAlreadyExistsError);

    expect(context.create).not.toHaveBeenCalled();
  });

  it("returns an active API key for an owned merchant and environment", async () => {
    const context = createServiceTestContext();
    context.findActiveKey.mockResolvedValue(apiKey);

    const result = await context.service.getActiveApiKey(userId, {
      merchantId,
      environment: ApiKeyEnvironment.TEST,
    });

    expect(context.getActiveMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
    );
    expect(context.findActiveKey).toHaveBeenCalledWith({
      merchantId,
      environment: ApiKeyEnvironment.TEST,
    });
    expect(result).toEqual(apiKey);
    expect(context.create).not.toHaveBeenCalled();
  });

  it("rejects when no active API key exists for the merchant and environment", async () => {
    const context = createServiceTestContext();

    await expect(
      context.service.getActiveApiKey(userId, {
        merchantId,
        environment: ApiKeyEnvironment.TEST,
      }),
    ).rejects.toBeInstanceOf(apiKeyErrors.ApiKeyNotFoundError);

    expect(context.findActiveKey).toHaveBeenCalledWith({
      merchantId,
      environment: ApiKeyEnvironment.TEST,
    });
    expect(context.create).not.toHaveBeenCalled();
  });

  it("returns API key records for an owned merchant", async () => {
    const context = createServiceTestContext();
    context.findByMerchantId.mockResolvedValue([apiKey]);

    const result = await context.service.getMerchantApiKeys({
      merchantId,
      userId,
    });

    expect(context.getActiveMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
    );
    expect(context.findByMerchantId).toHaveBeenCalledWith(merchantId);
    expect(result).toEqual({ merchantId, apiKeys: [apiKey] });
    expect(context.create).not.toHaveBeenCalled();
  });

  it("returns an empty key list for a merchant without API keys", async () => {
    const context = createServiceTestContext();

    const result = await context.service.getMerchantApiKeys({
      merchantId,
      userId,
    });

    expect(context.findByMerchantId).toHaveBeenCalledWith(merchantId);
    expect(result).toEqual({ merchantId, apiKeys: [] });
  });

  it("revokes an API key identified by its key ID for an owned merchant", async () => {
    const context = createServiceTestContext();
    const revokedAt = new Date("2026-01-02T03:04:05.000Z");
    const revokedApiKey = {
      ...apiKey,
      status: ApiKeyStatus.REVOKED,
      revokedAt,
    };
    vi.useFakeTimers();
    vi.setSystemTime(revokedAt);
    context.findByMerchantAndKeyId.mockResolvedValue(apiKey);
    context.revokeKey.mockResolvedValue(revokedApiKey);

    const result = await context.service.revokeApiKey({
      merchantId,
      apiKeyId: apiKey.keyId,
      userId,
    });

    expect(context.getActiveMerchantOwnedByUser).toHaveBeenCalledWith(
      userId,
      merchantId,
    );
    expect(context.findByMerchantAndKeyId).toHaveBeenCalledWith({
      merchantId,
      keyId: apiKey.keyId,
    });
    expect(context.revokeKey).toHaveBeenCalledWith({
      id: apiKey.id,
      revokedAt,
    });
    expect(result).toEqual(revokedApiKey);
  });

  it("rejects revoking an API key that does not belong to the merchant", async () => {
    const context = createServiceTestContext();

    await expect(
      context.service.revokeApiKey({
        merchantId,
        apiKeyId: apiKey.keyId,
        userId,
      }),
    ).rejects.toBeInstanceOf(apiKeyErrors.ApiKeyNotFoundError);

    expect(context.revokeKey).not.toHaveBeenCalled();
  });

  it("rejects revoking an API key that is already revoked", async () => {
    const context = createServiceTestContext();
    context.findByMerchantAndKeyId.mockResolvedValue({
      ...apiKey,
      status: ApiKeyStatus.REVOKED,
    });

    await expect(
      context.service.revokeApiKey({
        merchantId,
        apiKeyId: apiKey.keyId,
        userId,
      }),
    ).rejects.toBeInstanceOf(apiKeyErrors.RevokedApiKeyError);

    expect(context.revokeKey).not.toHaveBeenCalled();
  });

  it.each(["IMMEDIATELY", "24_HOURS"] as const)(
    "rotates an API key using the %s revoke strategy and returns its secret",
    async (oldKeyRevokeStrategy) => {
      const context = createServiceTestContext();
      const now = new Date("2026-01-02T03:04:05.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);
      context.findActiveKey.mockResolvedValue(apiKey);

      const result = await context.service.rotateApiKey({
        merchantId,
        userId,
        environment: ApiKeyEnvironment.TEST,
        oldKeyRevokeStrategy,
      });

      expect(context.getActiveMerchantOwnedByUser).toHaveBeenCalledWith(
        userId,
        merchantId,
      );
      expect(context.findActiveKey).toHaveBeenCalledWith({
        merchantId,
        environment: ApiKeyEnvironment.TEST,
      });
      expect(dbTransaction).toHaveBeenCalledOnce();
      expect(context.revokeKeyForRotation).toHaveBeenCalledWith(
        transactionClient,
        {
          id: apiKey.id,
          revokeNow: oldKeyRevokeStrategy === "IMMEDIATELY",
          graceEndsAt:
            oldKeyRevokeStrategy === "IMMEDIATELY"
              ? null
              : new Date(now.getTime() + 24 * 60 * 60 * 1000),
          revokedAt: oldKeyRevokeStrategy === "IMMEDIATELY" ? now : null,
        },
      );
      expect(context.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId,
          environment: ApiKeyEnvironment.TEST,
          status: ApiKeyStatus.ACTIVE,
          keyId: result.apiKey.keyId,
          secretHash: expect.any(String),
        }),
        transactionClient,
      );
      expect(result).toMatchObject({
        apiKey: {
          id: apiKey.id,
          merchantId,
          environment: ApiKeyEnvironment.TEST,
          status: ApiKeyStatus.ACTIVE,
          keyId: expect.stringMatching(/^pvo_test_[A-Za-z0-9_-]+$/),
        },
        keySecret: expect.any(String),
      });

      if (typeof result.keySecret !== "string") {
        throw new Error("Rotated API key response is missing its secret");
      }
      expect(context.create.mock.calls[0]?.[0].secretHash).toBe(
        hashKeySecret(result.keySecret),
      );
    },
  );

  it("rejects rotation when there is no active key", async () => {
    const context = createServiceTestContext();

    await expect(
      context.service.rotateApiKey({
        merchantId,
        userId,
        environment: ApiKeyEnvironment.TEST,
        oldKeyRevokeStrategy: "IMMEDIATELY",
      }),
    ).rejects.toBeInstanceOf(apiKeyErrors.ApiKeyNotFoundError);

    expect(context.revokeKeyForRotation).not.toHaveBeenCalled();
    expect(context.create).not.toHaveBeenCalled();
  });

  it("revokes all API keys owned by a user within the provided transaction", async () => {
    const context = createServiceTestContext();
    const revokedAt = new Date("2026-01-02T03:04:05.000Z");

    await context.service.revokeUserApiKeys(transactionClient, {
      userId,
      revokedAt,
    });

    expect(context.revokeAllByUserId).toHaveBeenCalledWith(transactionClient, {
      userId,
      revokedAt,
    });
  });
});
