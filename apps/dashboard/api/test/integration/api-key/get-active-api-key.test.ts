import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

const endpoint = (merchantId: string) =>
  `/api/merchants/${merchantId}/api-keys/active-key`;

describe("GET /api/merchants/:id/api-keys/active-key", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should return the active api key", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "getkey@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .get(endpoint(merchant.id))
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

  it("should not return secret fields", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nosecret@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({ merchantId: merchant.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).not.toHaveProperty("secretHash");
    expect(res.body.data).not.toHaveProperty("keySecret");
  });

  it("should return 401 without authorization", async () => {
    const { user } = await getAuthenticatedUser({ email: "noauth@example.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when no active key exists", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "nokey@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 404 for a revoked key", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "revoked@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      status: "REVOKED",
    });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 404 for another user's merchant", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "userA@example.com",
    });
    const { user: owner } = await getAuthenticatedUser({
      email: "userB@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: owner.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 400 when environment is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "missingenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for an invalid environment", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "invalidenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "STAGING" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});