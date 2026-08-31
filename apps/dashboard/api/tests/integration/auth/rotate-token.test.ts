import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("POST /api/auth/rotate-token", () => {
  beforeEach(async () => {
    await cleanup();
  });

  /**
   * Extract the raw `token` value from the signup/login refreshToken cookie.
   * The cookie is stored as a JSON-serialized object by Express (`j:{...}`),
   * so we parse it to get the `token` string that the service expects.
   */
  function extractRefreshToken(cookieHeader: string): string {
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    if (!match) throw new Error("refreshToken cookie not found");
    const decoded = decodeURIComponent(match[1]!);
    // cookie-parser serializes objects with "j:" prefix
    if (decoded.startsWith("j:")) {
      const obj = JSON.parse(decoded.slice(2));
      return obj.token;
    }
    return decoded;
  }

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and a new accessToken", async () => {
    const { refreshTokenCookie } = await AuthHelper.getAuthUser();
    const token = extractRefreshToken(refreshTokenCookie);

    const res = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe("string");
  });

  it("should set a new refreshToken cookie", async () => {
    const { refreshTokenCookie } = await AuthHelper.getAuthUser();
    const token = extractRefreshToken(refreshTokenCookie);

    const res = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${token}`)
      .expect(200);

    const cookies: string[] = (res.headers["set-cookie"] as any) ?? [];
    const newRefreshCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken="),
    );

    expect(newRefreshCookie).toBeDefined();
    expect(newRefreshCookie).toContain("HttpOnly");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 400 when refreshToken cookie is missing", async () => {
    const res = await request(app).post("/api/auth/rotate-token").expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when refreshToken is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", "refreshToken=invalid-token-value")
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("should invalidate the old refreshToken after rotation", async () => {
    const { refreshTokenCookie } = await AuthHelper.getAuthUser();
    const token = extractRefreshToken(refreshTokenCookie);

    // First rotation should succeed
    await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${token}`)
      .expect(200);

    // Second rotation with the same old token should fail
    const res = await request(app)
      .post("/api/auth/rotate-token")
      .set("Cookie", `refreshToken=${token}`)
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });
});
