import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";

describe("GET /api/merchants/:id/api-keys", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with list of API keys for the merchant", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    await MerchantFactory.createApiKey(merchant.id, {
      keyType: "SECRET",
      environment: "TEST",
    });
    await MerchantFactory.createApiKey(merchant.id, {
      keyType: "PUBLISHABLE",
      environment: "LIVE",
    });

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.merchantId).toBe(merchant.id);
    expect(Array.isArray(res.body.data.apiKeys)).toBe(true);
    expect(res.body.data.apiKeys).toHaveLength(2);

    // Verify sensitive fields are NOT present
    for (const key of res.body.data.apiKeys) {
      expect(key).not.toHaveProperty("keyHash");
      expect(key).not.toHaveProperty("keyValue");
      expect(key.id).toBeDefined();
      expect(key.merchantId).toBe(merchant.id);
      expect(key.keyType).toBeDefined();
      expect(key.environment).toBeDefined();
      expect(key.isActive).toBeDefined();
    }
  });

  it("should return empty array if merchant has no API keys", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.merchantId).toBe(merchant.id);
    expect(res.body.data.apiKeys).toEqual([]);
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with MERCHANT_NOT_FOUND if merchant does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-4000-a000-000000000000";

    const res = await request(app)
      .get(`/api/merchants/${nonExistentId}/api-keys`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 403 with MERCHANT_ACCESS_DENIED if merchant belongs to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const { authUser: user2 } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(user2.user.id);

    const res = await request(app)
      .get(`/api/merchants/${merchant.id}/api-keys`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(
      "/api/merchants/a0000000-0000-4000-a000-000000000000/api-keys",
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get("/api/merchants/a0000000-0000-4000-a000-000000000000/api-keys")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
