import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";

const API_KEYS_URL = "/api/api-keys";

describe("GET /api/api-keys/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with API key details excluding keyHash and keyValue", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);
    const apiKey = await MerchantFactory.createApiKey(merchant.id);

    const res = await request(app)
      .get(`${API_KEYS_URL}/${apiKey.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.apiKey).toBeDefined();
    expect(res.body.data.apiKey.id).toBe(apiKey.id);
    expect(res.body.data.apiKey.merchantId).toBe(merchant.id);
    expect(res.body.data.apiKey.keyType).toBe("SECRET");
    expect(res.body.data.apiKey.isActive).toBe(true);
    // Verify sensitive fields are stripped
    expect(res.body.data.apiKey).not.toHaveProperty("keyHash");
    expect(res.body.data.apiKey).not.toHaveProperty("keyValue");
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with API_KEY_NOT_FOUND if API key does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-4000-a000-000000000000";

    const res = await request(app)
      .get(`${API_KEYS_URL}/${nonExistentId}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 403 with MERCHANT_ACCESS_DENIED if API key belongs to another user's merchant", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const { authUser: user2 } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(user2.user.id);
    const apiKey = await MerchantFactory.createApiKey(merchant.id);

    const res = await request(app)
      .get(`${API_KEYS_URL}/${apiKey.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(
      `${API_KEYS_URL}/a0000000-0000-4000-a000-000000000000`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(`${API_KEYS_URL}/a0000000-0000-4000-a000-000000000000`)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
