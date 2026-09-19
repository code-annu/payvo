import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { loginUser } from "../../helper/auth.helper.js";

const endpoint = (apiKeyId: string) => `/api/api-keys/${apiKeyId}/revoke`;

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/api-keys/:apiKeyId/revoke", () => {
  it("revokes an active api key successfully", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
    });

    const response = await request(app)
      .post(endpoint(apiKey.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: apiKey.id,
        keyId: apiKey.keyId,
        status: "REVOKED",
        environment: "LIVE",
        revokedAt: expect.any(String),
      },
    });

    const updatedKey = await ApiKeyFactory.findApiKeyById(apiKey.id);
    expect(updatedKey?.status).toBe("REVOKED");
    expect(updatedKey?.revokedAt).not.toBeNull();
  });

  it("rejects request without access token", async () => {
    const response = await request(app).post(endpoint(randomUUID()));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("rejects an invalid api-key id format", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint("not-a-valid-uuid"))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns not found when api key does not exist", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(endpoint(randomUUID()))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("rejects revoking an already revoked key", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "TEST",
      status: "REVOKED",
    });

    const response = await request(app)
      .post(endpoint(apiKey.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("API_KEY_ALREADY_REVOKED");
  });

  it("does not allow revoking key belonging to another user's merchant", async () => {
    const owner = await loginUser(await UserFactory.createUser());
    const otherUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: owner.user.id,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
    });

    const response = await request(app)
      .post(endpoint(apiKey.id))
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");

    // Ensure the key was NOT revoked
    const unchangedKey = await ApiKeyFactory.findApiKeyById(apiKey.id);
    expect(unchangedKey?.status).toBe("ACTIVE");
  });

  it("rejects revoking key for an inactive merchant", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await MerchantFactory.createMerchant({
      userId: authUser.user.id,
      isActive: false,
    });
    const { apiKey } = await ApiKeyFactory.createApiKey({
      merchantId: merchant.id,
      environment: "LIVE",
    });

    const response = await request(app)
      .post(endpoint(apiKey.id))
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("MERCHANT_INACTIVE");

    // Key remains active
    const unchangedKey = await ApiKeyFactory.findApiKeyById(apiKey.id);
    expect(unchangedKey?.status).toBe("ACTIVE");
  });
});
