import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const ME_URL = "/api/user/me";

describe("PATCH /api/user/me", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should update fullname and return 200 with updated user data", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "Jane Doe" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullname).toBe("Jane Doe");
    expect(res.body.data.user.id).toBe(authUser.user.id);
    expect(res.body.data.user.email).toBe(authUser.user.email);
  });

  it("should update companyName and return 200 with updated user data", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ companyName: "Acme Corp" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.companyName).toBe("Acme Corp");
  });

  it("should allow setting companyName to null", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    // First set company name
    await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ companyName: "Acme Corp" });

    // Now clear it
    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ companyName: null });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.companyName).toBeNull();
  });

  it("should update both fullname and companyName simultaneously", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "Jane Doe", companyName: "Startup Inc" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullname).toBe("Jane Doe");
    expect(res.body.data.user.companyName).toBe("Startup Inc");
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if fullname is shorter than 3 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "Jo" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if fullname is empty", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if fullname exceeds 100 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "a".repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if companyName exceeds 100 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ companyName: "a".repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app)
      .patch(ME_URL)
      .send({ fullname: "Jane Doe" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", "Bearer invalid-token")
      .send({ fullname: "Jane Doe" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });

  // ── User state ─────────────────────────────────────────────────────

  it("should return 404 if user is soft-deleted", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    await prisma.user.update({
      where: { id: authUser.user.id },
      data: { deletedAt: new Date() },
    });

    const res = await request(app)
      .patch(ME_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ fullname: "Jane Doe" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
