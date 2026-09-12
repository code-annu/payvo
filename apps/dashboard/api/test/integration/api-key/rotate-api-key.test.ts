import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("POST /api/api-keys/:id/rotate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path – IMMEDIATELY
  // ---------------------------------------------------------------------------

  it("should return 201 with new api key data using IMMEDIATELY strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotate1@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${oldKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        keyId: expect.any(String),
        keySecret: expect.any(String),
        status: "ACTIVE",
        environment: "TEST",
        generatedAt: expect.any(String),
      },
    });

    // New key should be different from old key
    expect(res.body.data.id).not.toBe(oldKey.id);
  });

  it("should revoke the old key immediately", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "revokecheck@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    await request(app)
      .post(`/api/api-keys/${oldKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(201);

    const dbOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(dbOldKey).not.toBeNull();
    expect(dbOldKey!.status).toBe("REVOKED");
    expect(dbOldKey!.revokedAt).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Happy path – 24_HOURS
  // ---------------------------------------------------------------------------

  it("should return 201 with new api key data using 24_HOURS strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotate24@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${oldKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "24_HOURS" })
      .expect(201);

    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.id).not.toBe(oldKey.id);
  });

  it("should set old key to GRACE_PERIOD status with 24_HOURS strategy", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "grace@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    await request(app)
      .post(`/api/api-keys/${oldKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "24_HOURS" })
      .expect(201);

    const dbOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(dbOldKey).not.toBeNull();
    expect(dbOldKey!.status).toBe("GRACE_PERIOD");
    expect(dbOldKey!.graceEndsAt).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  it("should return 401 without authorization token", async () => {
    const { user } = await getAuthenticatedUser({
      email: "noauth@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${apiKey.id}/rotate`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Key not found
  // ---------------------------------------------------------------------------

  it("should return 404 API_KEY_NOT_FOUND when api key does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "keynotfound@example.com",
    });

    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/api-keys/${fakeUuid}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(404);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "API_KEY_NOT_FOUND",
      }),
    });
  });

  it("should return 404 when trying to rotate a REVOKED key", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "rotaterevoked@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey: revokedKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
      status: "REVOKED",
    });

    const res = await request(app)
      .post(`/api/api-keys/${revokedKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(404);

    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // Merchant access denied
  // ---------------------------------------------------------------------------

  it("should return 403 MERCHANT_ACCESS_DENIED for another user's key", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "attacker@example.com",
    });
    const { user: owner } = await getAuthenticatedUser({
      email: "owner@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: owner.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${apiKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "IMMEDIATELY" })
      .expect(403);

    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when oldKeyRevokeStrategy is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nostrategy@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${apiKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for invalid oldKeyRevokeStrategy value", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "badstrategy@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/api-keys/${apiKey.id}/rotate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ oldKeyRevokeStrategy: "NEVER" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
