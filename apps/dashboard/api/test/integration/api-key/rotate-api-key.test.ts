import app from "@/app.js";
import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
} from "@payvo/database/types";
import { hashKeySecret } from "@payvo/shared/api-key";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("POST /api/merchants/:merchantId/api-keys/rotate", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("rotates the active key immediately and leaves other environments unchanged", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const oldKey = await ApiKeyFactory.create(merchant.id);
    const liveKey = await ApiKeyFactory.create(merchant.id, {
      keyId: `pvo_live_${randomUUID()}`,
      environment: ApiKeyEnvironment.LIVE,
    });

    const response = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        environment: ApiKeyEnvironment.TEST,
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "API key rotated successfully",
      data: {
        id: expect.any(String),
        merchantId: merchant.id,
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
        keyId: expect.stringMatching(/^pvo_test_[A-Za-z0-9_-]+$/),
        keySecret: expect.any(String),
        graceEndsAt: null,
        revokedAt: null,
        lastUsedAt: null,
        generatedAt: expect.any(String),
      },
    });
    expect(response.body.data.id).not.toBe(oldKey.id);
    expect(response.body.data.keyId).not.toBe(oldKey.keyId);

    const storedOldKey = await ApiKeyFactory.find(oldKey.id);
    const storedNewKey = await ApiKeyFactory.find(response.body.data.id);
    const storedLiveKey = await ApiKeyFactory.find(liveKey.id);
    expect(storedOldKey).toMatchObject({
      status: ApiKeyStatus.REVOKED,
    });
    expect(storedOldKey?.revokedAt).toBeInstanceOf(Date);
    expect(storedOldKey?.graceEndsAt).toBeNull();
    expect(storedNewKey).toMatchObject({
      merchantId: merchant.id,
      keyId: response.body.data.keyId,
      environment: ApiKeyEnvironment.TEST,
      status: ApiKeyStatus.ACTIVE,
    });
    expect(storedNewKey?.secretHash).toBe(
      hashKeySecret(response.body.data.keySecret),
    );
    expect(storedNewKey?.secretHash).not.toBe(response.body.data.keySecret);
    expect(storedLiveKey).toMatchObject({
      status: ApiKeyStatus.ACTIVE,
      environment: ApiKeyEnvironment.LIVE,
    });
    expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toHaveLength(3);
  });

  it("keeps the previous key in its 24-hour grace period when requested", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const oldKey = await ApiKeyFactory.create(merchant.id);
    const requestStartedAt = Date.now();

    const response = await request(app)
      .post(`/api/merchants/${merchant.id}/api-keys/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        environment: ApiKeyEnvironment.TEST,
        oldKeyRevokeStrategy: "24_HOURS",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      merchantId: merchant.id,
      environment: ApiKeyEnvironment.TEST,
      status: ApiKeyStatus.ACTIVE,
      keySecret: expect.any(String),
      graceEndsAt: null,
      revokedAt: null,
    });

    const storedOldKey = await ApiKeyFactory.find(oldKey.id);
    const storedNewKey = await ApiKeyFactory.find(response.body.data.id);
    expect(storedOldKey).toMatchObject({
      status: ApiKeyStatus.GRACE_PERIOD,
      revokedAt: null,
    });
    expect(storedOldKey?.graceEndsAt).toBeInstanceOf(Date);
    expect(storedOldKey!.graceEndsAt!.getTime()).toBeGreaterThanOrEqual(
      requestStartedAt + 24 * 60 * 60 * 1000,
    );
    expect(storedOldKey!.graceEndsAt!.getTime()).toBeLessThanOrEqual(
      Date.now() + 24 * 60 * 60 * 1000,
    );
    expect(storedNewKey).toMatchObject({
      status: ApiKeyStatus.ACTIVE,
      environment: ApiKeyEnvironment.TEST,
    });
  });

  it.each([
    ["no key", null],
    ["a revoked key", ApiKeyStatus.REVOKED],
    ["a grace-period key", ApiKeyStatus.GRACE_PERIOD],
  ] as const)(
    "returns not found when the merchant has %s for the environment",
    async (_description, status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id);
      if (status) {
        await ApiKeyFactory.create(merchant.id, { status });
      }

      const response = await request(app)
        .post(`/api/merchants/${merchant.id}/api-keys/rotate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          environment: ApiKeyEnvironment.TEST,
          oldKeyRevokeStrategy: "IMMEDIATELY",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
      expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toHaveLength(
        status ? 1 : 0,
      );
    },
  );

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found when rotating a key for a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: anotherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchant = await MerchantFactory.create(anotherUser.id);
      const oldKey = await ApiKeyFactory.create(merchant.id);
      const merchantId =
        merchantOwner === "nonexistent" ? randomUUID() : merchant.id;

      const response = await request(app)
        .post(`/api/merchants/${merchantId}/api-keys/rotate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          environment: ApiKeyEnvironment.TEST,
          oldKeyRevokeStrategy: "IMMEDIATELY",
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
      expect(await ApiKeyFactory.find(oldKey.id)).toMatchObject({
        status: ApiKeyStatus.ACTIVE,
      });
    },
  );

  it.each([MerchantStatus.SUSPENDED, MerchantStatus.CLOSED])(
    "rejects rotating a key for a %s merchant",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id, { status });
      const oldKey = await ApiKeyFactory.create(merchant.id);

      const response = await request(app)
        .post(`/api/merchants/${merchant.id}/api-keys/rotate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          environment: ApiKeyEnvironment.TEST,
          oldKeyRevokeStrategy: "IMMEDIATELY",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");
      expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toEqual([
        expect.objectContaining({ id: oldKey.id, status: ApiKeyStatus.ACTIVE }),
      ]);
    },
  );

  it.each([
    ["invalid merchant id", "not-a-uuid", ApiKeyEnvironment.TEST, "IMMEDIATELY"],
    ["invalid environment", randomUUID(), "STAGING", "IMMEDIATELY"],
    ["invalid revoke strategy", randomUUID(), ApiKeyEnvironment.TEST, "LATER"],
  ] as const)(
    "rejects an %s",
    async (_description, merchantId, environment, oldKeyRevokeStrategy) => {
      const { accessToken } = await createAuthenticatedUser();

      const response = await request(app)
        .post(`/api/merchants/${merchantId}/api-keys/rotate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ environment, oldKeyRevokeStrategy });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    },
  );

  it("rejects an unauthenticated rotation request", async () => {
    const response = await request(app)
      .post(`/api/merchants/${randomUUID()}/api-keys/rotate`)
      .send({
        environment: ApiKeyEnvironment.TEST,
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
