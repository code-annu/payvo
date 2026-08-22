import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";

const MERCHANTS_URL = "/api/merchants";

describe("GET /api/merchants/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with merchant data when given valid id", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .get(`${MERCHANTS_URL}/${merchant.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.merchant).toBeDefined();
    expect(res.body.data.merchant.id).toBe(merchant.id);
    expect(res.body.data.merchant.userId).toBe(authUser.user.id);
    expect(res.body.data.merchant.isActive).toBe(true);
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with MERCHANT_NOT_FOUND if merchant does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-4000-a000-000000000000";

    const res = await request(app)
      .get(`${MERCHANTS_URL}/${nonExistentId}`)
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
      .get(`${MERCHANTS_URL}/${merchant.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(
      `${MERCHANTS_URL}/a0000000-0000-4000-a000-000000000000`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(`${MERCHANTS_URL}/a0000000-0000-4000-a000-000000000000`)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
