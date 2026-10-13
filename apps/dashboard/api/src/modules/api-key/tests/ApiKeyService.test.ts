import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
  type Merchant,
} from "@payvo/database/types";
import { hashKeySecret } from "@payvo/shared/api-key";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantContract } from "@/modules/merchant/contract/merchant.contract.js";
import ApiKeyService from "../application/service/api-key.service.js";
import * as apiKeyErrors from "../error/api-key.errors.js";
import ApiKeyMapper from "../mapper/api-key.mapper.js";
import ApiKeyRepository from "../repository/api-key.repository.js";

const userId = "02b6e011-cb0f-4472-8d85-9b6332028a30";
const merchantId = "13d84e90-646d-42b8-8ba2-441338db58f6";
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
  const merchantContract: MerchantContract = {
    getActiveMerchantOwnedByUser: vi.fn().mockResolvedValue(merchant),
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
    create,
    getActiveMerchantOwnedByUser,
  };
}

describe("ApiKeyService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
      id: apiKey.id,
      merchantId,
      environment: ApiKeyEnvironment.TEST,
      status: ApiKeyStatus.ACTIVE,
      keyId: expect.stringMatching(/^pvo_test_[A-Za-z0-9_-]+$/),
      keySecret: expect.any(String),
    });

    const { keySecret } = result;
    if (typeof keySecret !== "string") {
      throw new Error("Generated API key response is missing its secret");
    }

    expect(context.create).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId,
        keyId: result.keyId,
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
    expect(result).toMatchObject({
      id: apiKey.id,
      merchantId,
      keyId: apiKey.keyId,
      environment: ApiKeyEnvironment.TEST,
      status: ApiKeyStatus.ACTIVE,
      keySecret: undefined,
    });
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
});