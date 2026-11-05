import app from "@/app.js";
import { UserAddressType } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import UserAddressFactory from "../../../factory/user-address.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { createAddressRequestBody } from "../../../helper/address.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

describe("PATCH /api/account/addresses/:addressId", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("updates the provided fields of a non-default address", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const address = await UserAddressFactory.create(user.id, {
      isDefault: false,
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${address.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ street1: "Updated Street", city: "Boston" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Address updated successfully",
      data: {
        id: address.id,
        userId: user.id,
        street1: "Updated Street",
        city: "Boston",
        isDefault: false,
      },
    });
    const stored = await UserAddressFactory.find(address.id);
    expect(stored?.street1).toBe("Updated Street");
    expect(stored?.city).toBe("Boston");
    expect(stored?.countryCode).toBe("US");
  });

  it("updates a default address without clearing its default status", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const address = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${address.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ label: "Home" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: address.id,
      label: "Home",
      isDefault: true,
    });
    expect((await UserAddressFactory.find(address.id))?.isDefault).toBe(true);
  });

  it("sets an address as default when no other same-type address is default", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const currentAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: false,
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${currentAddress.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isDefault: true });

    expect(response.status).toBe(200);
    expect((await UserAddressFactory.find(currentAddress.id))?.isDefault).toBe(
      true,
    );
  });

  it("replaces the existing same-type default", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const oldDefault = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });
    const newDefault = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: false,
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${newDefault.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isDefault: true });

    expect(response.status).toBe(200);
    expect((await UserAddressFactory.find(oldDefault.id))?.isDefault).toBe(
      false,
    );
    expect((await UserAddressFactory.find(newDefault.id))?.isDefault).toBe(
      true,
    );
  });

  it("keeps default status independent between address types", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const billingAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.BILLING,
      isDefault: true,
    });
    const oldShippingDefault = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });
    const newShippingDefault = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: false,
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${newShippingDefault.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isDefault: true });

    expect(response.status).toBe(200);
    expect((await UserAddressFactory.find(billingAddress.id))?.isDefault).toBe(
      true,
    );
    expect(
      (await UserAddressFactory.find(oldShippingDefault.id))?.isDefault,
    ).toBe(false);
    expect(
      (await UserAddressFactory.find(newShippingDefault.id))?.isDefault,
    ).toBe(true);
  });

  it.each([{}, { street1: "" }, { countryCode: "USA" }, { isDefault: "true" }])(
    "rejects an empty or invalid update body: %o",
    async (body) => {
      const { user, accessToken } = await createAuthenticatedUser();
      const address = await UserAddressFactory.create(user.id);

      const response = await request(app)
        .patch(`/api/account/addresses/${address.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    },
  );

  it("returns not found when trying to update another user's address", async () => {
    const [{ user: firstUser, accessToken }, { user: secondUser }] =
      await Promise.all([createAuthenticatedUser(), createAuthenticatedUser()]);
    const address = await UserAddressFactory.create(secondUser.id, {
      street1: "Original street",
    });

    const response = await request(app)
      .patch(`/api/account/addresses/${address.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ street1: "Changed by another user" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ADDRESS_NOT_FOUND");
    expect((await UserAddressFactory.find(address.id))?.street1).toBe(
      "Original street",
    );
    expect(firstUser.id).not.toBe(secondUser.id);
  });

  it("rejects an invalid address id", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/api/account/addresses/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAddressRequestBody());

    expect(response.status).toBe(400);
  });

  it("rejects unauthenticated address updates", async () => {
    const response = await request(app)
      .patch("/api/account/addresses/13d84e90-646d-42b8-8ba2-441338db58f6")
      .send({ street1: "Updated" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
