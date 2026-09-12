import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("GET /api/merchant", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with all merchants belonging to the authenticated user", async () => {
    const user1 = await getAuthenticatedUser({ email: "user1@example.com" });
    const user2 = await getAuthenticatedUser({ email: "user2@example.com" });

    // User 1 merchants
    const m1 = await MerchantFactory.createMerchant({
      userId: user1.user.id,
      mid: "MID-USER1-A",
      isActive: true,
    });
    const m2 = await MerchantFactory.createMerchant({
      userId: user1.user.id,
      mid: "MID-USER1-B",
      isActive: false,
    });

    // User 2 merchant
    await MerchantFactory.createMerchant({
      userId: user2.user.id,
      mid: "MID-USER2-A",
      isActive: true,
    });

    const res = await request(app)
      .get("/api/merchant")
      .set("Authorization", `Bearer ${user1.accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        userId: user1.user.id,
        merchants: expect.arrayContaining([
          { id: m1.id, mid: m1.mid, isActive: true },
          { id: m2.id, mid: m2.mid, isActive: false },
        ]),
      },
    });

    expect(res.body.data.merchants).toHaveLength(2);
  });

  it("should return empty merchants array when user has no merchants", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "empty@example.com",
    });

    const res = await request(app)
      .get("/api/merchant")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        userId: user.id,
        merchants: [],
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app).get("/api/merchant").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .get("/api/merchant")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
