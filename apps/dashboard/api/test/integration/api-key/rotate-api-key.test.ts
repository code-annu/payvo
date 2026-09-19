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
  `/api/merchants/${merchantId}/rotate-api-key`;

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/merchants/:merchantId/rotate-api-key", () => {
  it("rotates api key immediately revoking old key", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

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

    // Verify old key was revoked immediately
    const updatedOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(updatedOldKey?.status).toBe("REVOKED");
    expect(updatedOldKey?.revokedAt).not.toBeNull();
  });

  it("rotates api key with 24_HOURS grace period strategy", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    const { apiKey: oldKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "LIVE",
        oldKeyRevokeStrategy: "24_HOURS",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.environment).toBe("LIVE");

    // Verify old key was placed into grace period
    const updatedOldKey = await ApiKeyFactory.findApiKeyById(oldKey.id);
    expect(updatedOldKey?.status).toBe("GRACE_PERIOD");
    expect(updatedOldKey?.graceEndsAt).not.toBeNull();
  });

  it("rejects request without access token", async () => {
    const response = await request(app)
      .post(endpoint(randomUUID()))
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("rejects an invalid merchant id", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint("invalid-id"))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects missing or invalid rotate strategy", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const responseNoStrategy = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ environment: "TEST" });

    expect(responseNoStrategy.status).toBe(400);
    expect(responseNoStrategy.body.error.code).toBe("INVALID_REQUEST");

    const responseBadStrategy = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "NEVER",
      });

    expect(responseBadStrategy.status).toBe(400);
    expect(responseBadStrategy.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns not found when merchant does not exist", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint(randomUUID()))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("does not allow rotating key for another user's merchant", async () => {
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
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("rejects rotation for an inactive merchant", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
      isActive: false,
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("returns not found when there is no active key to rotate", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });

    const response = await request(app)
      .post(endpoint(merchant.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({
        environment: "TEST",
        oldKeyRevokeStrategy: "IMMEDIATELY",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
  });
});
