import app from "@/app.js";
import {
  ApiKeyEnvironment,
  ApiKeyStatus,
  MerchantStatus,
} from "@payvo/database/types";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("GET /api/merchants/:merchantId/api-keys", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns the active key for an owned merchant and environment", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const apiKey = await ApiKeyFactory.create(merchant.id);

    const response = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys`)
      .query({ environment: ApiKeyEnvironment.TEST })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Active API key fetched successfully",
      data: {
        id: apiKey.id,
        merchantId: merchant.id,
        keyId: apiKey.keyId,
        environment: ApiKeyEnvironment.TEST,
        status: ApiKeyStatus.ACTIVE,
        graceEndsAt: null,
        revokedAt: null,
        lastUsedAt: null,
        generatedAt: expect.any(String),
      },
    });
    expect(response.body.data).not.toHaveProperty("keySecret");
    expect(await ApiKeyFactory.findByMerchantId(merchant.id)).toHaveLength(1);
  });

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found when retrieving a key for a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: anotherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchant = await MerchantFactory.create(anotherUser.id);
      const merchantId =
        merchantOwner === "nonexistent" ? randomUUID() : merchant.id;

      const response = await request(app)
        .get(`/api/merchants/${merchantId}/api-keys`)
        .query({ environment: ApiKeyEnvironment.TEST })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
    },
  );

  it.each([MerchantStatus.SUSPENDED, MerchantStatus.CLOSED])(
    "rejects retrieving a key for a %s merchant",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id, { status });
      await ApiKeyFactory.create(merchant.id);

      const response = await request(app)
        .get(`/api/merchants/${merchant.id}/api-keys`)
        .query({ environment: ApiKeyEnvironment.TEST })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");
    },
  );

  it("returns not found when the merchant has no key for the requested environment", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    await ApiKeyFactory.create(merchant.id);

    const response = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys`)
      .query({ environment: ApiKeyEnvironment.LIVE })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it.each([ApiKeyStatus.REVOKED, ApiKeyStatus.GRACE_PERIOD])(
    "does not return a key with %s status",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id);
      await ApiKeyFactory.create(merchant.id, { status });

      const response = await request(app)
        .get(`/api/merchants/${merchant.id}/api-keys`)
        .query({ environment: ApiKeyEnvironment.TEST })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
    },
  );

  it.each([
    ["missing", undefined],
    ["invalid", "STAGING"],
  ] as const)(
    "rejects a %s environment query",
    async (_description, environment) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id);
      const requestBuilder = request(app).get(
        `/api/merchants/${merchant.id}/api-keys`,
      );
      if (environment !== undefined) {
        requestBuilder.query({ environment });
      }

      const response = await requestBuilder.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    },
  );

  it("rejects an invalid merchant id", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/merchants/not-a-uuid/api-keys")
      .query({ environment: ApiKeyEnvironment.TEST })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated key retrieval", async () => {
    const response = await request(app)
      .get(`/api/merchants/${randomUUID()}/api-keys`)
      .query({ environment: ApiKeyEnvironment.TEST });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
