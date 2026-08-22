import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";

const MERCHANTS_URL = "/api/merchants";

describe("GET /api/merchants", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with an array of user merchants", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant1 = await MerchantFactory.createMerchant(authUser.user.id);
    const merchant2 = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .get(MERCHANTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.merchants)).toBe(true);
    expect(res.body.data.merchants).toHaveLength(2);

    const ids = res.body.data.merchants.map((m: any) => m.id);
    expect(ids).toContain(merchant1.id);
    expect(ids).toContain(merchant2.id);
  });

  it("should return empty array if user has no merchants", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .get(MERCHANTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.merchants).toEqual([]);
  });

  it("should not return merchants belonging to other users", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const { authUser: user2 } = await AuthHelper.getAuthenticatedUser();

    const user1Merchant = await MerchantFactory.createMerchant(user1.user.id);
    await MerchantFactory.createMerchant(user2.user.id);

    const res = await request(app)
      .get(MERCHANTS_URL)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.merchants).toHaveLength(1);
    expect(res.body.data.merchants[0].id).toBe(user1Merchant.id);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(MERCHANTS_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(MERCHANTS_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
