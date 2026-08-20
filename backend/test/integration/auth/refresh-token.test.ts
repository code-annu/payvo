import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";

const REFRESH_URL = "/api/auth/refresh";

describe("POST /api/auth/refresh", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with a new access token when given a valid refresh token cookie", async () => {
    const { cookies } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should rotate the refresh token cookie", async () => {
    const { cookies } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    const newCookies = res.headers["set-cookie"];
    expect(newCookies).toBeDefined();
    const refreshCookie = Array.isArray(newCookies)
      ? newCookies.find((c: string) => c.startsWith("refreshToken="))
      : newCookies;
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("should issue a working access token after refresh", async () => {
    const { cookies } = await AuthHelper.getAuthenticatedUser();

    const refreshRes = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);

    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;

    // Use the new access token on a protected route
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${newAccessToken}`);

    // Should not get 401
    expect(logoutRes.status).not.toBe(401);
  });

  // ── Invalid / missing token ────────────────────────────────────────

  it("should return 400 if no refresh token cookie is provided", async () => {
    const res = await request(app).post(REFRESH_URL);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 if refresh token cookie is invalid", async () => {
    const res = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", "refreshToken=invalid-token-value");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  // ── Revoked token ──────────────────────────────────────────────────

  it("should return 401 if the old refresh token is used after rotation", async () => {
    const { cookies } = await AuthHelper.getAuthenticatedUser();

    // First refresh — rotates the token
    const firstRefresh = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);
    expect(firstRefresh.status).toBe(200);

    // Second refresh with the OLD cookie — the old token hash no longer exists
    const secondRefresh = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);

    expect(secondRefresh.status).toBe(401);
  });
});
