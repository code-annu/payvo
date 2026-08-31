import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("PATCH /api/users/me", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and update fullname and companyName", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Jane Doe", companyName: "NewCorp" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullname).toBe("Jane Doe");
    expect(res.body.data.user.companyName).toBe("NewCorp");
  });

  it("should update only fullname when companyName is not provided", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Updated Name" })
      .expect(200);

    expect(res.body.data.user.fullname).toBe("Updated Name");
    expect(res.body.data.user.companyName).toBe(user.companyName);
  });

  it("should update only companyName when fullname is not provided", async () => {
    const { accessToken, user } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: "Only Company" })
      .expect(200);

    expect(res.body.data.user.companyName).toBe("Only Company");
    expect(res.body.data.user.fullname).toBe(user.fullname);
  });

  it("should set companyName to null when explicitly passed as null", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: null })
      .expect(200);

    expect(res.body.data.user.companyName).toBeNull();
  });

  it("should not leak passwordHash in the response", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Safe User" })
      .expect(200);

    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 401 when unauthenticated", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .send({ fullname: "Jane Doe" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when fullname is too short", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "Jo" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when fullname exceeds max length", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullname: "A".repeat(51) })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when companyName exceeds max length", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ companyName: "C".repeat(101) })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
