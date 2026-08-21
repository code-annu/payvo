import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import ProjectFactory from "../../factory/project.factory";
import UserFactory from "../../factory/user.factory";
import { prisma } from "@/core/prisma/prisma.client";

const PROJECTS_URL = "/api/projects";

describe("PATCH /api/projects/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should update project name and return 200 with updated project", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(
      authUser.user.id,
      "Original Name",
    );

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.name).toBe("Updated Name");
    expect(res.body.data.project.id).toBe(project.id);

    // Verify in DB
    const dbProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(dbProject?.name).toBe("Updated Name");
  });

  it("should update project isActive status and return 200 with updated project", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(
      authUser.user.id,
      "Active Project",
      true,
    );

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.isActive).toBe(false);

    // Verify in DB
    const dbProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(dbProject?.isActive).toBe(false);
  });

  it("should update both name and isActive simultaneously", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(
      authUser.user.id,
      "Old Name",
      true,
    );

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "Renamed Project", isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.name).toBe("Renamed Project");
    expect(res.body.data.project.isActive).toBe(false);
  });

  // ── Validation errors ──────────────────────────────────────────────

  it("should return 400 if empty body is provided", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(authUser.user.id);

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if name is shorter than 2 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(authUser.user.id);

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if name exceeds 100 characters", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(authUser.user.id);

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "a".repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with PROJECT_NOT_FOUND if project does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-0000-0000-000000000000";

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${nonExistentId}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("should return 403 with PROJECT_ACCESS_DENIED if updating project belonging to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const otherUser = await UserFactory.createUser(
      "other_user@example.com",
      "Peter@1234",
    );
    const otherProject = await ProjectFactory.createProject(
      otherUser.id,
      "Other User Project",
    );

    const res = await request(app)
      .patch(`${PROJECTS_URL}/${otherProject.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`)
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app)
      .patch(`${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`)
      .send({ name: "New Name" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .patch(`${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`)
      .set("Authorization", "Bearer invalid-token")
      .send({ name: "New Name" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
