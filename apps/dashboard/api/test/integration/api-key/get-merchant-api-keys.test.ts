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

describe("GET /api/merchants/:merchantId/api-keys/list", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns all API keys for an owned merchant without exposing secrets", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const activeKey = await ApiKeyFactory.create(merchant.id);
    const revokedKey = await ApiKeyFactory.create(merchant.id, {
      environment: ApiKeyEnvironment.LIVE,
      keyId: `pvo_live_${randomUUID()}`,
      status: ApiKeyStatus.REVOKED,
      revokedAt: new Date("2026-01-02T03:04:05.000Z"),
    });

    const response = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys/list`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Merchant API keys fetched successfully",
      data: {
        merchantId: merchant.id,
        apiKeys: expect.arrayContaining([
          {
            id: activeKey.id,
            status: ApiKeyStatus.ACTIVE,
            environment: ApiKeyEnvironment.TEST,
            graceEndsAt: null,
            revokedAt: null,
            lastUsedAt: null,
            generatedAt: expect.any(String),
          },
          {
            id: revokedKey.id,
            status: ApiKeyStatus.REVOKED,
            environment: ApiKeyEnvironment.LIVE,
            graceEndsAt: null,
            revokedAt: expect.any(String),
            lastUsedAt: null,
            generatedAt: expect.any(String),
          },
        ]),
      },
    });
    expect(response.body.data.apiKeys).toHaveLength(2);
    expect(JSON.stringify(response.body)).not.toContain(activeKey.keyId);
    expect(JSON.stringify(response.body)).not.toContain("test-secret-hash");
  });

  it("returns an empty list when the merchant has no API keys", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);

    const response = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys/list`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { merchantId: merchant.id, apiKeys: [] },
    });
  });

  it.each(["nonexistent", "other-user"] as const)(
    "returns not found when retrieving API keys for a %s merchant",
    async (merchantOwner) => {
      const [{ accessToken }, { user: anotherUser }] = await Promise.all([
        createAuthenticatedUser(),
        createAuthenticatedUser(),
      ]);
      const merchant = await MerchantFactory.create(anotherUser.id);
      const merchantId =
        merchantOwner === "nonexistent" ? randomUUID() : merchant.id;
      const existingKey = await ApiKeyFactory.create(merchant.id);

      const response = await request(app)
        .get(`/api/merchants/${merchantId}/api-keys/list`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
      expect(await ApiKeyFactory.find(existingKey.id)).toMatchObject({
        status: ApiKeyStatus.ACTIVE,
      });
    },
  );

  it.each([MerchantStatus.SUSPENDED, MerchantStatus.CLOSED])(
    "rejects retrieving API keys for a %s merchant",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id, { status });
      await ApiKeyFactory.create(merchant.id);

      const response = await request(app)
        .get(`/api/merchants/${merchant.id}/api-keys/list`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");
    },
  );

  it("rejects unauthenticated API-key retrieval", async () => {
    const response = await request(app)
      .get(`/api/merchants/${randomUUID()}/api-keys/list`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
