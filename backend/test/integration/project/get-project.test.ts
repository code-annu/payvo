import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import ProjectFactory from "../../factory/project.factory";
import UserFactory from "../../factory/user.factory";

const PROJECTS_URL = "/api/projects";

describe("GET /api/projects/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with project details when project belongs to authenticated user", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const project = await ProjectFactory.createProject(
      authUser.user.id,
      "Analytics Dashboard",
    );

    const res = await request(app)
      .get(`${PROJECTS_URL}/${project.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project).toBeDefined();
    expect(res.body.data.project.id).toBe(project.id);
    expect(res.body.data.project.name).toBe("Analytics Dashboard");
    expect(res.body.data.project.userId).toBe(authUser.user.id);
    expect(res.body.data.project.isActive).toBe(true);
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with PROJECT_NOT_FOUND if project does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-0000-0000-000000000000";

    const res = await request(app)
      .get(`${PROJECTS_URL}/${nonExistentId}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("should return 403 with PROJECT_ACCESS_DENIED if project belongs to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const otherUser = await UserFactory.createUser(
      "other_user@example.com",
      "Peter@1234",
    );
    const otherProject = await ProjectFactory.createProject(
      otherUser.id,
      "Secret Project",
    );

    const res = await request(app)
      .get(`${PROJECTS_URL}/${otherProject.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PROJECT_ACCESS_DENIED");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(
      `${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(`${PROJECTS_URL}/a0000000-0000-0000-0000-000000000000`)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
