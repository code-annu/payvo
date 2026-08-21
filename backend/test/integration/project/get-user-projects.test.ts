import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import ProjectFactory from "../../factory/project.factory";
import UserFactory from "../../factory/user.factory";

const PROJECTS_URL = "/api/projects";

describe("GET /api/projects", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should return 200 with an array of user projects", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    await ProjectFactory.createProject(authUser.user.id, "Project Alpha");
    await ProjectFactory.createProject(authUser.user.id, "Project Beta");

    const res = await request(app)
      .get(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.projects)).toBe(true);
    expect(res.body.data.projects).toHaveLength(2);

    const names = res.body.data.projects.map((p: any) => p.name);
    expect(names).toContain("Project Alpha");
    expect(names).toContain("Project Beta");
  });

  it("should return empty array if user has no projects", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .get(PROJECTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects).toEqual([]);
  });

  it("should not return projects belonging to other users", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const otherUser = await UserFactory.createUser(
      "other_user@example.com",
      "Peter@1234",
    );

    await ProjectFactory.createProject(user1.user.id, "User1 Project");
    await ProjectFactory.createProject(otherUser.id, "User2 Project");

    const res = await request(app)
      .get(PROJECTS_URL)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.projects).toHaveLength(1);
    expect(res.body.data.projects[0].name).toBe("User1 Project");
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).get(PROJECTS_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .get(PROJECTS_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
