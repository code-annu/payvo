import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { loginUser } from "../../helper/auth.helper.js";

const merchantPath = "/api/merchant";

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/merchant", () => {
  it("creates a merchant for the authenticated user", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(merchantPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        mid: expect.stringMatching(/^[a-zA-Z0-9]+$/),
        userId: authUser.user.id,
        isActive: true,
      },
    });
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).post(merchantPath);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });

  it("rejects an invalid access token", async () => {
    const response = await request(app)
      .post(merchantPath)
      .set("Authorization", "Bearer invalid-access-token");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_ACCESS_TOKEN" },
    });
  });
});
