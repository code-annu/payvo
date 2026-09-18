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

async function createMerchant(accessToken: string) {
  const response = await request(app)
    .post(merchantPath)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(201);
  return response.body.data;
}

describe("GET /api/merchant", () => {
  it("returns an empty merchant collection for a new user", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(merchantPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { userId: authUser.user.id, merchants: [] },
    });
  });

  it("returns only the authenticated user's merchants", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const otherUser = await loginUser(await UserFactory.createUser());
    const merchant = await createMerchant(authUser.accessToken);
    const otherMerchant = await createMerchant(otherUser.accessToken);

    const response = await request(app)
      .get(merchantPath)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        userId: authUser.user.id,
        merchants: [
          {
            id: merchant.id,
            mid: merchant.mid,
            isActive: true,
          },
        ],
      },
    });
    expect(response.body.data.merchants).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: otherMerchant.id })]),
    );
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).get(merchantPath);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });
});
