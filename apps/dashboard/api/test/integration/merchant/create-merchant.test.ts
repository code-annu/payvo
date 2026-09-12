import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("POST /api/merchant", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 201 with merchant data for authenticated user", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "merchant.owner@example.com",
    });

    const res = await request(app)
      .post("/api/merchant")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: expect.any(String),
        mid: expect.any(String),
        userId: user.id,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    // Check database persistence
    const merchantId = res.body.data.id;
    const dbMerchant = await MerchantFactory.findMerchantById(merchantId);
    expect(dbMerchant).not.toBeNull();
    expect(dbMerchant!.userId).toBe(user.id);
    expect(dbMerchant!.mid).toBe(res.body.data.mid);
    expect(dbMerchant!.isActive).toBe(true);
  });

  it("should generate distinct and unique mids across multiple creations", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "multi.merchant@example.com",
    });

    const res1 = await request(app)
      .post("/api/merchant")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const res2 = await request(app)
      .post("/api/merchant")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    expect(res1.body.data.mid).not.toBe(res2.body.data.mid);
    expect(res1.body.data.id).not.toBe(res2.body.data.id);

    const merchants = await MerchantFactory.findMerchantsByUserId(user.id);
    expect(merchants).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app).post("/api/merchant").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .post("/api/merchant")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
