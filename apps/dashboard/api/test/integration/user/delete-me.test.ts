import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { UserFactory } from "../../factory/user.factory.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("DELETE /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 204 on successful user deletion", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    await request(app)
      .delete("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);
  });

  it("should soft-delete the user in the database (set deletedAt)", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    await request(app)
      .delete("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const dbUser = await UserFactory.findUserById(user.id);
    expect(dbUser).not.toBeNull();
    expect(dbUser!.deletedAt).not.toBeNull();
  });

  it("should not physically remove the user from the database", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    await request(app)
      .delete("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    // User record should still exist
    const dbUser = await UserFactory.findUserById(user.id);
    expect(dbUser).not.toBeNull();
    expect(dbUser!.email).toBe("jane@example.com");
  });

  // ---------------------------------------------------------------------------
  // Cannot access after deletion
  // ---------------------------------------------------------------------------

  it("should return an error when trying to GET /me after deletion", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    await request(app)
      .delete("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app).delete("/api/user/me").expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .delete("/api/user/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
