import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("DELETE /api/merchants/:id", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 on successful merchant delete", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    // Create a merchant
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Delete the merchant
    const res = await request(app)
      .delete(`/api/merchants/${merchantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.merchant.id).toBe(merchantId);
    expect(res.body.data.merchant.userId).toBe(user.id);
  });

  it("should hard delete the merchant so GET returns 404", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .delete(`/api/merchants/${merchantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/api/merchants/${merchantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 400 when id is not a valid UUID", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .delete("/api/merchants/invalid-uuid")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when deleting a non-existent merchant", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .delete("/api/merchants/00000000-0000-4000-8000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 404 when merchant is already deleted", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // First delete
    await request(app)
      .delete(`/api/merchants/${merchantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Second delete
    const res = await request(app)
      .delete(`/api/merchants/${merchantId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .delete("/api/merchants/00000000-0000-4000-8000-000000000000")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
