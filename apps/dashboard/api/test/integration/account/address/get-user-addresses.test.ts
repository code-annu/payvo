import app from "@/app.js";
import { UserAddressType } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import UserAddressFactory from "../../../factory/user-address.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

describe("GET /api/account/addresses", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("returns only addresses belonging to the authenticated user", async () => {
    const [{ user: firstUser, accessToken }, { user: secondUser }] =
      await Promise.all([createAuthenticatedUser(), createAuthenticatedUser()]);
    const firstAddress = await UserAddressFactory.create(firstUser.id, {
      addressType: UserAddressType.SHIPPING,
      street1: "1 User Street",
      isDefault: true,
    });
    const secondAddress = await UserAddressFactory.create(firstUser.id, {
      addressType: UserAddressType.BILLING,
      street1: "2 User Street",
    });
    await UserAddressFactory.create(secondUser.id, {
      street1: "Other user's address",
    });

    const response = await request(app)
      .get("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Addresses fetched successfully",
      data: {
        userId: firstUser.id,
        addresses: [
          {
            id: secondAddress.id,
            addressType: UserAddressType.BILLING,
            street1: "2 User Street",
          },
          {
            id: firstAddress.id,
            addressType: UserAddressType.SHIPPING,
            street1: "1 User Street",
            isDefault: true,
          },
        ],
      },
    });
    expect(response.body.data.addresses).toHaveLength(2);
    expect(response.body.data.addresses[0]).not.toHaveProperty("userId");
  });

  it("returns an empty list when the user has no addresses", async () => {
    const { user, accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .get("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ userId: user.id, addresses: [] });
  });

  it("rejects unauthenticated address retrieval", async () => {
    const response = await request(app).get("/api/account/addresses");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
