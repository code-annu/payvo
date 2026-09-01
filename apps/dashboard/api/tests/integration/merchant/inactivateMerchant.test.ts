import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("PATCH /api/merchants/:id/inactivate", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and inactivated merchant when authenticated", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    // Create a merchant
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Inactivate it
    const res = await request(app)
      .patch(`/api/merchants/${merchantId}/inactivate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.merchant.id).toBe(merchantId);
    expect(res.body.data.merchant.isActive).toBe(false);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 400 when id is not a valid UUID", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/merchants/invalid-uuid/inactivate")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/merchants/00000000-0000-4000-8000-000000000000/inactivate")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .patch("/api/merchants/00000000-0000-4000-8000-000000000000/inactivate")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
