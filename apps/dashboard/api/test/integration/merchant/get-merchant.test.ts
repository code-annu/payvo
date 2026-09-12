import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("GET /api/merchant/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with merchant data for the owner", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "owner@example.com",
    });

    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
      mid: "MID-123456",
    });

    const res = await request(app)
      .get(`/api/merchant/${merchant.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: merchant.id,
        mid: merchant.mid,
        userId: user.id,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser();
    const nonExistentId = crypto.randomUUID();

    const res = await request(app)
      .get(`/api/merchant/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // User mismatch
  // ---------------------------------------------------------------------------

  it("should return 403 when merchant belongs to another user", async () => {
    const user1 = await getAuthenticatedUser({ email: "user1@example.com" });
    const user2 = await getAuthenticatedUser({ email: "user2@example.com" });

    const merchant = await MerchantFactory.createMerchant({
      userId: user1.user.id,
    });

    const res = await request(app)
      .get(`/api/merchant/${merchant.id}`)
      .set("Authorization", `Bearer ${user2.accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");
  });

  // ---------------------------------------------------------------------------
  // Inactive merchant
  // ---------------------------------------------------------------------------

  it("should return 403 when merchant is inactive", async () => {
    const { accessToken, user } = await getAuthenticatedUser();

    const inactiveMerchant = await MerchantFactory.createMerchant({
      userId: user.id,
      isActive: false,
    });

    const res = await request(app)
      .get(`/api/merchant/${inactiveMerchant.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  // ---------------------------------------------------------------------------
  // Path parameter validation
  // ---------------------------------------------------------------------------

  it("should return 400 when merchant id is not a valid UUID", async () => {
    const { accessToken } = await getAuthenticatedUser();

    const res = await request(app)
      .get("/api/merchant/invalid-not-uuid")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app)
      .get(`/api/merchant/${crypto.randomUUID()}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .get(`/api/merchant/${crypto.randomUUID()}`)
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
