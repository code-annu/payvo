import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("GET /api/merchants/:id/active-key", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with active api key data", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "getkey@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        keyId: expect.any(String),
        status: "ACTIVE",
        environment: "TEST",
        lastUsedAt: null,
        createdAt: expect.any(String),
      },
    });
  });

  it("should NOT return the secretHash in the response", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nosecret@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).not.toHaveProperty("secretHash");
    expect(res.body.data).not.toHaveProperty("keySecret");
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

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Key not found
  // ---------------------------------------------------------------------------

  it("should return 404 API_KEY_NOT_FOUND when no active key exists", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nokey@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "API_KEY_NOT_FOUND",
      }),
    });
  });

  it("should return 404 when key exists but is REVOKED", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "revoked@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
      status: "REVOKED",
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // Merchant access denied
  // ---------------------------------------------------------------------------

  it("should return 403 MERCHANT_ACCESS_DENIED for another user's merchant", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "userA@example.com",
    });
    const { user: otherUser } = await getAuthenticatedUser({
      email: "userB@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: otherUser.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when environment query param is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "missingenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for invalid environment query param", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "invalidenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/active-key`)
      .query({ environment: "STAGING" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
