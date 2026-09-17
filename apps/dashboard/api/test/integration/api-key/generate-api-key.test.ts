import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { ApiKeyFactory } from "../../factory/api-key.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

const endpoint = (merchantId: string) =>
  `/api/merchants/${merchantId}/api-keys/generate`;

describe("POST /api/merchants/:id/api-keys/generate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("should generate a TEST api key", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keygen@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
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

  it("should create the api key row", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keygen2@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const dbKey = await ApiKeyFactory.findApiKeyById(res.body.data.id);
    expect(dbKey).not.toBeNull();
    expect(dbKey!.merchantId).toBe(merchant.id);
    expect(dbKey!.status).toBe("ACTIVE");
  });

  it("should generate keys for LIVE", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "keylive@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(res.body.data.environment).toBe("LIVE");
  });

  it("should return 401 without authorization", async () => {
    const { user } = await getAuthenticatedUser({ email: "noauth@example.com" });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .send({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "notfound@example.com",
    });

    const res = await request(app)
      .post(endpoint("00000000-0000-0000-0000-000000000000"))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(404);

    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 404 for another user's merchant", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "user1@example.com",
    });
    const { user: owner } = await getAuthenticatedUser({
      email: "user2@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: owner.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(404);

    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 409 for an inactive merchant", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "inactive@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
      isActive: false,
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(409);

    expect(res.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("should return 409 when an active key already exists", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "dupe@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(409);

    expect(res.body.error.code).toBe("API_KEY_ALREADY_EXISTS");
  });

  it("should allow generating a key for a different environment", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "diffenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    expect(res.body.data.environment).toBe("LIVE");
  });

  it("should return 400 when environment is missing", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "noenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 for an invalid environment", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "badenv@example.com",
    });
    const merchant = await MerchantFactory.createMerchant({ userId: user.id });

    const res = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "STAGING" })
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});