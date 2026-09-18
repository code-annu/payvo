import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { cleanupUser } from "../../helper/cleanup.js";
import { authPath, loginUser } from "../../helper/auth.helper.js";

afterEach(async () => {
  await cleanupUser();
});

describe("POST /api/auth/logout", () => {
  it("clears the refresh cookie and revokes the authenticated session", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .post(`${authPath}/logout`)
      .set("Authorization", `Bearer ${authUser.accessToken}`)
      .set("Cookie", authUser.refreshCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: "Logged out successfully" },
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=;")]),
    );

    const rotateResponse = await request(app)
      .post(`${authPath}/rotate-token`)
      .set("Cookie", authUser.refreshCookie);

    expect(rotateResponse.status).toBe(401);
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).post(`${authPath}/logout`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });

  it("rejects an invalid access token", async () => {
    const response = await request(app)
      .post(`${authPath}/logout`)
      .set("Authorization", "Bearer invalid-access-token");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_ACCESS_TOKEN" },
    });
  });
});
