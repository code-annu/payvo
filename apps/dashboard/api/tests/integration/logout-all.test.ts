import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import cleanup from "../helper/cleanup.js";
import AuthHelper from "../helper/auth.helper.js";

/**
 * Extract the raw `token` value from the signup/login refreshToken cookie.
 */
function extractRefreshToken(cookieHeader: string): string {
  const match = cookieHeader.match(/refreshToken=([^;]+)/);
  if (!match) throw new Error("refreshToken cookie not found");
  const decoded = decodeURIComponent(match[1]!);
  if (decoded.startsWith("j:")) {
    const obj = JSON.parse(decoded.slice(2));
    return obj.token;
  }
  return decoded;
}

describe("POST /api/auth/logout-all", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 204 when all sessions are logged out", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);
  });

  it("should return empty body on successful logout-all", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    expect(res.body).toEqual({});
  });

  it("should invalidate all sessions for the user", async () => {
    const email = `multi-session+${Date.now()}@test.com`;
    const password = "StrongP@ss1";
    const fullname = "Multi Session";

    // Create user
    await request(app)
      .post("/api/auth/signup")
      .send({ email, password, fullname })
      .expect(201);

    // Login again to create a second session
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    const accessToken: string = loginRes.body.data.accessToken;
    const cookies: string[] = (loginRes.headers["set-cookie"] as any) ?? [];
    const refreshTokenCookie =
      cookies.find((c: string) => c.startsWith("refreshToken=")) ?? "";
    const token = extractRefreshToken(refreshTokenCookie);

    // Logout all sessions
    await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    // Trying to rotate token should fail — the session is revoked
    const res = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${token}`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("REVOKED_REFRESH_TOKEN");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when Authorization header is missing", async () => {
    const res = await request(app).post("/api/auth/logout-all").expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 when token is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should return 401 when Authorization header has wrong format", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", accessToken)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
