import { afterEach, describe, expect, it } from "vitest";
import { client } from "@payvo/database/client";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";

afterEach(async () => {
  await cleanupUser();
});

describe("Database Constraint: uq_api_keys_active_merchant_env", () => {
  it("disallows more than one active api key for the same merchant and environment", async () => {
    const user = await UserFactory.createUser();
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    // First active key should succeed
    const firstKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
      status: "ACTIVE",
    });
    expect(firstKey.apiKey.status).toBe("ACTIVE");

    // Second active key with same merchantId and environment must fail with unique constraint violation
    await expect(
      ApiKeyFactory.createApiKey({
        merchantId: merchant.id,
        environment: "LIVE",
        status: "ACTIVE",
      }),
    ).rejects.toThrow();
  });

  it("allows multiple non-active keys (REVOKED / GRACE_PERIOD) alongside an ACTIVE key", async () => {
    const user = await UserFactory.createUser();
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    // Create a revoked key
    const revokedKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
      status: "REVOKED",
    });
    expect(revokedKey.apiKey.status).toBe("REVOKED");

    // Create a grace period key
    const graceKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
      status: "GRACE_PERIOD",
    });
    expect(graceKey.apiKey.status).toBe("GRACE_PERIOD");

    // Create an active key - should succeed because existing keys are not ACTIVE
    const activeKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
      status: "ACTIVE",
    });
    expect(activeKey.apiKey.status).toBe("ACTIVE");

    const allKeys = await ApiKeyFactory.findApiKeysByMerchantId(merchant.id);
    expect(allKeys).toHaveLength(3);
  });

  it("allows active keys in different environments for the same merchant", async () => {
    const user = await UserFactory.createUser();
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const testKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
      status: "ACTIVE",
    });
    const liveKey = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
      status: "ACTIVE",
    });

    expect(testKey.apiKey.status).toBe("ACTIVE");
    expect(liveKey.apiKey.status).toBe("ACTIVE");
    expect(testKey.apiKey.environment).toBe("TEST");
    expect(liveKey.apiKey.environment).toBe("LIVE");
  });

  it("allows active keys with the same environment for different merchants", async () => {
    const user = await UserFactory.createUser();
    const merchantA = await MerchantFactory.createMerchant({ userId: user.id });
    const merchantB = await MerchantFactory.createMerchant({ userId: user.id });

    const keyA = await ApiKeyFactory.createApiKey({
      merchantId: merchantA.id,
      environment: "LIVE",
      status: "ACTIVE",
    });
    const keyB = await ApiKeyFactory.createApiKey({
      merchantId: merchantB.id,
      environment: "LIVE",
      status: "ACTIVE",
    });

    expect(keyA.apiKey.status).toBe("ACTIVE");
    expect(keyB.apiKey.status).toBe("ACTIVE");
  });
});
