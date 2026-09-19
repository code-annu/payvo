import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { loginUser } from "../../helper/auth.helper.js";

const endpoint = (merchantId: string) =>
  `/api/merchants/${merchantId}/active-api-key`;

afterEach(async () => {
  await cleanupUser();
});

describe("GET /api/merchants/:merchantId/active-api-key", () => {
  it("returns the active api key details for merchant and environment", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const response = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: apiKey.id,
        keyId: apiKey.keyId,
        status: "ACTIVE",
        environment: "TEST",
        generatedAt: expect.any(String),
      },
    });
    // secretHash should not be exposed
    expect(response.body.data.secretHash).toBeUndefined();
    expect(response.body.data.keySecret).toBeUndefined();
  });

  it("rejects request without access token", async () => {
    const response = await request(app)
      .get(endpoint(randomUUID()))
      .query({ environment: "TEST" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });

  it("rejects an invalid merchant id", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(endpoint("not-a-uuid"))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects an invalid or missing environment query parameter", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const responseNoEnv = await request(app)
      .get(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(responseNoEnv.status).toBe(400);
    expect(responseNoEnv.body.error.code).toBe("INVALID_REQUEST");

    const responseBadEnv = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "UNKNOWN" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(responseBadEnv.status).toBe(400);
    expect(responseBadEnv.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns not found when merchant does not exist", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(endpoint(randomUUID()))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("does not allow access to another user's merchant active key", async () => {
    const owner = await loginUser(await UserFactory.createUser());
    const otherUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: owner.user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const response = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("rejects query for an inactive merchant", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
      isActive: false,
    });

    const response = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("returns 404 when no active api key exists for merchant and environment", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const response = await request(app)
      .get(endpoint(merchant.id))
      .query({ environment: "TEST" })
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
  });
});
