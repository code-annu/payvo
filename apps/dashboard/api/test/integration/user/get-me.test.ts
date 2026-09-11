import request from "supertest";
import resetDb from "../../helper/cleanup";
import { UserFactory } from "../../factory/user.factory";
import { getAuthenticatedUser } from "../../helper/auth.helper";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";

describe("GET /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with user profile for authenticated user", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "jane@example.com",
      fullname: "Jane Doe",
      companyName: "Acme Inc",
    });

    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: user.id,
        email: "jane@example.com",
        fullname: "Jane Doe",
        companyName: "Acme Inc",
        isEmailVerified: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should NOT expose passwordHash or deletedAt in response", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).not.toHaveProperty("passwordHash");
    expect(res.body.data).not.toHaveProperty("deletedAt");
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app).get("/api/user/me").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
