import { randomUUID } from "node:crypto";
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

describe("GET /api/merchant/:merchantId", () => {
  it("returns merchant details for the owner", async () => {
    const authUser = await loginUser(await UserFactory.createUser());
    const merchant = await createMerchant(authUser.accessToken);

    const response = await request(app)
      .get(`${merchantPath}/${merchant.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: merchant,
    });
  });

  it("rejects a merchant id that is not a UUID", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(`${merchantPath}/invalid-merchant-id`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("returns not found for a merchant that does not exist", async () => {
    const authUser = await loginUser(await UserFactory.createUser());

    const response = await request(app)
      .get(`${merchantPath}/${randomUUID()}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MERCHANT_NOT_FOUND" },
    });
  });

  it("does not expose another user's merchant", async () => {
    const owner = await loginUser(await UserFactory.createUser());
    const otherUser = await loginUser(await UserFactory.createUser());
    const merchant = await createMerchant(owner.accessToken);

    const response = await request(app)
      .get(`${merchantPath}/${merchant.id}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MERCHANT_NOT_FOUND" },
    });
  });

  it("rejects requests without an access token", async () => {
    const response = await request(app).get(`${merchantPath}/${randomUUID()}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "MISSING_ACCESS_TOKEN" },
    });
  });
});
