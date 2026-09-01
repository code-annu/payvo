import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("GET /api/merchants", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and user merchants list when authenticated", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    // Create a merchant first
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const res = await request(app)
      .get("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.merchants).toBeDefined();
    expect(res.body.data.merchants.length).toBe(1);
    expect(res.body.data.merchants[0].id).toBe(createRes.body.data.merchant.id);
    expect(res.body.data.merchants[0].isActive).toBe(true);
  });

  it("should return empty merchants array when user has no merchants", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.merchants).toEqual([]);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app).get("/api/merchants").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid auth token is provided", async () => {
    const res = await request(app)
      .get("/api/merchants")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
