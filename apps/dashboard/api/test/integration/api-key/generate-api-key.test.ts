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
  `/api/merchants/${merchantId}/generate-api-key`;

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/merchants/:merchantId/generate-api-key", () => {
  it("generates an active api key with plain secret for owner", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        keyId: expect.stringMatching(/^pvo_test_/),
        keySecret: expect.any(String),
        status: "ACTIVE",
        environment: "TEST",
        generatedAt: expect.any(String),
      },
    });

    const persisted = await ApiKeyFactory.findApiKeyById(response.body.data.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe("ACTIVE");
    expect(persisted?.merchantId).toBe(merchant.id);
  });

  it("rejects request without access token", async () => {
    const response = await request(app)
      .post(endpoint(randomUUID()))
      .send({ environment: "TEST" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });

  it("rejects an invalid merchant id", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint("not-a-uuid"))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejects an invalid or missing environment", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const responseNoEnv = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({});

    expect(responseNoEnv.status).toBe(400);
    expect(responseNoEnv.body.error.code).toBe("INVALID_REQUEST");

    const responseBadEnv = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "STAGING" });

    expect(responseBadEnv.status).toBe(400);
    expect(responseBadEnv.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns not found when merchant does not exist", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint(randomUUID()))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MERCHANT_NOT_FOUND" },
    });
  });

  it("does not allow generating key for another user's merchant", async () => {
    const owner = await loginUser(await UserFactory.createUser());
    const otherUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: owner.user.id,
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("rejects key generation for an inactive merchant", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
      isActive: false,
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("rejects when an active key already exists for the environment", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "LIVE" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("API_KEY_ALREADY_EXISTS");
  });

  it("allows generating a key for a different environment", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "LIVE" });

    expect(response.status).toBe(201);
    expect(response.body.data.environment).toBe("LIVE");
  });
});
