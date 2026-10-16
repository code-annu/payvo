import app from "@/app.js";
import { ApiKeyStatus, MerchantStatus } from "@payvo/database/types";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("DELETE /api/merchants/:merchantId/api-keys/:apiKeyId", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("revokes an API key identified by its key ID", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const apiKey = await ApiKeyFactory.create(merchant.id);

    const response = await request(app)
      .delete(`/api/merchants/${merchant.id}/api-keys/${apiKey.keyId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "API key revoked successfully",
      data: {
        id: apiKey.id,
        merchantId: merchant.id,
        keyId: apiKey.keyId,
        status: ApiKeyStatus.REVOKED,
        graceEndsAt: null,
        revokedAt: expect.any(String),
        lastUsedAt: null,
        generatedAt: expect.any(String),
      },
    });
    expect(response.body.data).not.toHaveProperty("keySecret");
    expect(response.body.data).not.toHaveProperty("secretHash");

    const storedKey = await ApiKeyFactory.find(apiKey.id);
    expect(storedKey).toMatchObject({
      merchantId: merchant.id,
      keyId: apiKey.keyId,
      status: ApiKeyStatus.REVOKED,
      graceEndsAt: null,
    });
    expect(storedKey?.revokedAt).toBeInstanceOf(Date);
  });

  it("rejects revoking an API key that has already been revoked", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const apiKey = await ApiKeyFactory.create(merchant.id, {
      status: ApiKeyStatus.REVOKED,
      revokedAt: new Date("2026-01-02T03:04:05.000Z"),
    });

    const response = await request(app)
      .delete(`/api/merchants/${merchant.id}/api-keys/${apiKey.keyId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("REVOKED_API_KEY");
    expect(await ApiKeyFactory.find(apiKey.id)).toMatchObject({
      status: ApiKeyStatus.REVOKED,
      revokedAt: apiKey.revokedAt,
    });
  });

  it("returns not found when the API key does not exist for the merchant", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const merchant = await MerchantFactory.create(user.id);
    const apiKey = await ApiKeyFactory.create(merchant.id);
    const unknownKeyId = `pvo_test_${randomUUID()}`;

    const response = await request(app)
      .delete(`/api/merchants/${merchant.id}/api-keys/${unknownKeyId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
    expect(await ApiKeyFactory.find(apiKey.id)).toMatchObject({
      status: ApiKeyStatus.ACTIVE,
    });
  });

  it("does not revoke a key when the merchant belongs to another user", async () => {
    const [{ accessToken }, { user: anotherUser }] = await Promise.all([
      createAuthenticatedUser(),
      createAuthenticatedUser(),
    ]);
    const merchant = await MerchantFactory.create(anotherUser.id);
    const apiKey = await ApiKeyFactory.create(merchant.id);

    const response = await request(app)
      .delete(`/api/merchants/${merchant.id}/api-keys/${apiKey.keyId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
    expect(await ApiKeyFactory.find(apiKey.id)).toMatchObject({
      status: ApiKeyStatus.ACTIVE,
      revokedAt: null,
    });
  });

  it.each([MerchantStatus.SUSPENDED, MerchantStatus.CLOSED])(
    "rejects revoking an API key for a %s merchant",
    async (status) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const merchant = await MerchantFactory.create(user.id, { status });
      const apiKey = await ApiKeyFactory.create(merchant.id);

      const response = await request(app)
        .delete(`/api/merchants/${merchant.id}/api-keys/${apiKey.keyId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("MERCHANT_NOT_ACTIVE");
      expect(await ApiKeyFactory.find(apiKey.id)).toMatchObject({
        status: ApiKeyStatus.ACTIVE,
        revokedAt: null,
      });
    },
  );

  it("rejects unauthenticated API-key revocation", async () => {
    const response = await request(app).delete(
      `/api/merchants/${randomUUID()}/api-keys/pvo_test_${randomUUID()}`,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
