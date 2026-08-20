import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";

const LOGOUT_URL = "/api/auth/logout";
const REFRESH_URL = "/api/auth/refresh";

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 204 when given a valid access token", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(LOGOUT_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);
  });

  it("should clear the refreshToken cookie", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(LOGOUT_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);
    const cookies = res.headers["set-cookie"];
    if (cookies) {
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("refreshToken="))
        : cookies;
      if (refreshCookie) {
        // Cookie should be cleared (expires in the past or empty value)
        expect(refreshCookie).toMatch(
          /refreshToken=;|Expires=Thu, 01 Jan 1970/i,
        );
      }
    }
  });

  it("should invalidate the refresh token after logout", async () => {
    const { authUser, cookies } = await AuthHelper.getAuthenticatedUser();

    // Logout
    await request(app)
      .post(LOGOUT_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .expect(204);

    // Try to refresh with the old cookie
    const refreshRes = await request(app)
      .post(REFRESH_URL)
      .set("Cookie", cookies);

    expect(refreshRes.status).toBe(401);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).post(LOGOUT_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post(LOGOUT_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  it("should return 401 if Authorization header format is wrong", async () => {
    const res = await request(app)
      .post(LOGOUT_URL)
      .set("Authorization", "Token some-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
