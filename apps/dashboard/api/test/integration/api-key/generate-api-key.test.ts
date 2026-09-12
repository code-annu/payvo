import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { UserFactory } from "../../factory/user.factory.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("POST /api/merchants/:id/generate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 201 with api key data on valid generation", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keygen@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
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
  });

  it("should create an api key row in the database", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keygen2@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const dbKey = await ApiKeyFactory.findApiKeyById(res.body.data.id);
    expect(dbKey).not.toBeNull();
    expect(dbKey!.status).toBe("ACTIVE");
    expect(dbKey!.environment).toBe("TEST");
    expect(dbKey!.merchantId).toBe(merchant.id);
  });

  it("should generate keys for LIVE environment", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keylive@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(res.body.data.environment).toBe("LIVE");
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
      .post(`/api/merchants/${merchant.id}/generate`)
      .send({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Merchant not found
  // ---------------------------------------------------------------------------

  it("should return 404 MERCHANT_NOT_FOUND when merchant does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "notfound@example.com",
    });

    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/merchants/${fakeUuid}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(404);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "MERCHANT_NOT_FOUND",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Merchant access denied
  // ---------------------------------------------------------------------------

  it("should return 403 MERCHANT_ACCESS_DENIED when merchant belongs to another user", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "user1@example.com",
    });
    const { user: otherUser } = await getAuthenticatedUser({
      email: "user2@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: otherUser.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(403);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "MERCHANT_ACCESS_DENIED",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Merchant inactive
  // ---------------------------------------------------------------------------

  it("should return 403 MERCHANT_INACTIVE when merchant is inactive", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "inactive@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
      isActive: false,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(403);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "MERCHANT_INACTIVE",
      }),
    });
  });

  // ---------------------------------------------------------------------------
  // Duplicate key
  // ---------------------------------------------------------------------------

  it("should return 409 API_KEY_ALREADY_EXISTS when active key already exists for environment", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "dupe@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    // Create an existing active key
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(409);

    expect(res.body).toEqual({
      success: false,
      error: expect.objectContaining({
        code: "API_KEY_ALREADY_EXISTS",
      }),
    });
  });

  it("should allow generating a key for different environment even if one exists", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "diffenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    // Create TEST key
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    // Generate LIVE key should succeed
    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(res.body.data.environment).toBe("LIVE");
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when environment is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "noenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for invalid environment value", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "badenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    const res = await request(app)
      .post(`/api/merchants/${merchant.id}/generate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "STAGING" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});
