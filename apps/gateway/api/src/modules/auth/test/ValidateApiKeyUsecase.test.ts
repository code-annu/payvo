import { beforeEach, describe, expect, it, vi } from "vitest";
import ValidateApiKeyUsecase from "../application/usecase/ValidateApiKeyUsecase.js";
import { hashKeySecret } from "@payvo/shared/api-key";
import {
  InvalidApiKeyCredentialsError,
  RevokedApiKeyError,
} from "../error/auth.errors.js";

describe("ValidateApiKeyUsecase", () => {
  const apiKeyRepo = {
    findByKeyId: vi.fn(),
    findMerchantById: vi.fn(),
    findUserById: vi.fn(),
  };

  const usecase = new ValidateApiKeyUsecase(apiKeyRepo as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validKeySecret = "sec_test_123456789";
  const validApiKey = {
    id: "key-1",
    merchantId: "merchant-1",
    keyId: "key_test_123456789",
    secretHash: hashKeySecret(validKeySecret),
    environment: "TEST" as const,
    status: "ACTIVE" as const,
    graceEndsAt: null,
    revokedAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validMerchant = {
    id: "merchant-1",
    userId: "user-1",
    isActive: true,
  };

  const validUser = {
    id: "user-1",
  };

  it("successfully validates active API key credentials", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue(validApiKey);
    apiKeyRepo.findMerchantById.mockResolvedValue(validMerchant);
    apiKeyRepo.findUserById.mockResolvedValue(validUser);

    const result = await usecase.execute({
      keyId: validApiKey.keyId,
      keySecret: validKeySecret,
    });

    expect(result).toEqual({
      valid: true,
      merchantId: "merchant-1",
      environment: "TEST",
    });
    expect(apiKeyRepo.findByKeyId).toHaveBeenCalledWith(validApiKey.keyId);
    expect(apiKeyRepo.findMerchantById).toHaveBeenCalledWith("merchant-1");
    expect(apiKeyRepo.findUserById).toHaveBeenCalledWith("user-1");
  });

  it("throws InvalidApiKeyCredentialsError if key is not found", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue(null);

    await expect(
      usecase.execute({ keyId: "nonexistent", keySecret: "any" }),
    ).rejects.toBeInstanceOf(InvalidApiKeyCredentialsError);
  });

  it("throws InvalidApiKeyCredentialsError if secret hash does not match", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue(validApiKey);

    await expect(
      usecase.execute({ keyId: validApiKey.keyId, keySecret: "wrong_secret" }),
    ).rejects.toBeInstanceOf(InvalidApiKeyCredentialsError);
  });

  it("throws RevokedApiKeyError if key is revoked", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue({
      ...validApiKey,
      status: "REVOKED",
    });

    await expect(
      usecase.execute({ keyId: validApiKey.keyId, keySecret: validKeySecret }),
    ).rejects.toBeInstanceOf(RevokedApiKeyError);
  });

  it("throws InvalidApiKeyCredentialsError if merchant is inactive", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue(validApiKey);
    apiKeyRepo.findMerchantById.mockResolvedValue({
      ...validMerchant,
      isActive: false,
    });

    await expect(
      usecase.execute({ keyId: validApiKey.keyId, keySecret: validKeySecret }),
    ).rejects.toBeInstanceOf(InvalidApiKeyCredentialsError);
  });

  it("throws InvalidApiKeyCredentialsError if user does not exist", async () => {
    apiKeyRepo.findByKeyId.mockResolvedValue(validApiKey);
    apiKeyRepo.findMerchantById.mockResolvedValue(validMerchant);
    apiKeyRepo.findUserById.mockResolvedValue(null);

    await expect(
      usecase.execute({ keyId: validApiKey.keyId, keySecret: validKeySecret }),
    ).rejects.toBeInstanceOf(InvalidApiKeyCredentialsError);
  });
});
