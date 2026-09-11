import request from "supertest";
import resetDb from "../../helper/cleanup";
import { UserFactory } from "../../factory/user.factory";
import { getAuthenticatedUser } from "../../helper/auth.helper";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";

describe("PATCH /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 200 with updated user when fullname is changed", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "jane@example.com",
      fullname: "Jane Doe",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Jane Updated" })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: user.id,
        fullname: "Jane Updated",
      }),
    });
  });

  it("should return 200 with updated user when companyName is changed", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
      companyName: "Old Corp",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: "New Corp" })
      .expect(200);

    expect(res.body.data.companyName).toBe("New Corp");
  });

  it("should allow setting companyName to null", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
      companyName: "Acme Inc",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: null })
      .expect(200);

    expect(res.body.data.companyName).toBeNull();
  });

  it("should persist updates in the database", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "jane@example.com",
      fullname: "Jane Doe",
    });

    await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Jane Persisted" })
      .expect(200);

    const dbUser = await UserFactory.findUserById(user.id);
    expect(dbUser).not.toBeNull();
    expect(dbUser!.fullname).toBe("Jane Persisted");
  });

  it("should NOT expose passwordHash or deletedAt in response", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Jane New" })
      .expect(200);

    expect(res.body.data).not.toHaveProperty("passwordHash");
    expect(res.body.data).not.toHaveProperty("deletedAt");
  });

  // ---------------------------------------------------------------------------
  // Validation errors
  // ---------------------------------------------------------------------------

  it("should return 400 when fullname is too short", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "AB" })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when fullname exceeds max length", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "A".repeat(51) })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("should return 400 when companyName exceeds max length", async () => {
    const { accessToken } = await getAuthenticatedUser({
      email: "jane@example.com",
    });

    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: "C".repeat(101) })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app)
      .patch("/api/user/me")
      .send({ fullname: "Jane" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .patch("/api/user/me")
      .set("Authorization", "Bearer invalid-token")
      .send({ fullname: "Jane" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
