import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("GET /api/users/me", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and user data when authenticated", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.fullname).toBe(user.fullname);
    expect(res.body.data.user.companyName).toBe(user.companyName);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.user.createdAt).toBeDefined();
    expect(res.body.data.user.updatedAt).toBeDefined();
  });

  it("should include email in the response", async () => {
    const { accessToken } = await AuthHelper.getAuthUser({
      email: "getme@example.com",
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.email).toBe("getme@example.com");
  });

  it("should not leak passwordHash in the response", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should not leak deletedAt in the response", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.deletedAt).toBeUndefined();
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app).get("/api/users/me").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid token is provided", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when user is soft-deleted", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    // Delete the user first
    await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Try to get the deleted user
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
