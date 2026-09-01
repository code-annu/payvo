import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("POST /api/merchants", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 201 and created merchant when authenticated", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.merchant).toBeDefined();
    expect(res.body.data.merchant.id).toBeDefined();
    expect(res.body.data.merchant.userId).toBe(user.id);
    expect(res.body.data.merchant.isActive).toBe(true);
    expect(res.body.data.merchant.createdAt).toBeDefined();
    expect(res.body.data.merchant.updatedAt).toBeDefined();
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app).post("/api/merchants").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid auth token is provided", async () => {
    const res = await request(app)
      .post("/api/merchants")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
