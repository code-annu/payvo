import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const PROJECTS_URL = "/api/projects";

describe("POST /api/projects", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 201 with project data when given valid input and auth token", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "My SaaS App" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project).toBeDefined();
    expect(res.body.data.project.id).toBeDefined();
    expect(res.body.data.project.name).toBe("My SaaS App");
    expect(res.body.data.project.userId).toBe(authUser.user.id);
    expect(res.body.data.project.isActive).toBe(true);
    expect(res.body.data.project.createdAt).toBeDefined();
    expect(res.body.data.project.updatedAt).toBeDefined();

    // Verify persisted in DB
    const dbProject = await prisma.project.findUnique({
      where: { id: res.body.data.project.id },
    });
    expect(dbProject).not.toBeNull();
    expect(dbProject?.name).toBe("My SaaS App");
    expect(dbProject?.userId).toBe(authUser.user.id);
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if name is missing", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if name is empty", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if name is shorter than 2 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if name exceeds 100 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "a".repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app)
      .post(PROJECTS_URL)
      .send({ name: "My SaaS App" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post(PROJECTS_URL)
      .set("Authorization", "Bearer invalid-token")
      .send({ name: "My SaaS App" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
