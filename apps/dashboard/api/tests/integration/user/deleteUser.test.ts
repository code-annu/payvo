import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("DELETE /api/users/me", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 on successful delete", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.fullname).toBe(user.fullname);
  });

  it("should not leak passwordHash in the response", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should soft-delete the user so GET returns 404", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when unauthenticated", async () => {
    const res = await request(app).delete("/api/users/me").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 404 when user is already deleted", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    // First delete
    await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Second delete
    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
