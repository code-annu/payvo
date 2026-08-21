import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import ProjectFactory from "../../factory/project.factory";
import UserFactory from "../../factory/user.factory";
import { prisma } from "@/core/prisma/prisma.client";

const PROJECTS_URL = "/api/projects";

describe("DELETE /api/projects/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should delete project and return 204 when project belongs to user", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(
      authUser.user.id,
      "Project to Delete",
    );

    const res = await request(app)
      .delete(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);

    // Verify deleted in DB
    const dbProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    expect(dbProject).toBeNull();
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with PROJECT_NOT_FOUND if project does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-0000-0000-000000000000";

    const res = await request(app)
      .delete(`${PROJECTS_URL}/${nonExistentId}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("should return 403 with PROJECT_ACCESS_DENIED if attempting to delete project belonging to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const otherUser = await UserFactory.createUser(
      "other_user@example.com",
      "Peter@1234",
    );
    const otherProject = await ProjectFactory.createProject(
      otherUser.id,
      "Other's Project",
    );

    const res = await request(app)
      .delete(`${PROJECTS_URL}/${otherProject.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_ACCESS_DENIED");

    // Verify project was NOT deleted
    const dbProject = await prisma.project.findUnique({
      where: { id: otherProject.id },
    });
    expect(dbProject).not.toBeNull();
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).delete(
      `${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .delete(`${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
