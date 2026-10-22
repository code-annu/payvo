import app from "@/app.js";
import { UserAddressType } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import UserAddressFactory from "../../../factory/user-address.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

describe("DELETE /api/account/addresses/:addressId", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("deletes a non-default address", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const address = await UserAddressFactory.create(user.id, {
      isDefault: false,
    });

    const response = await request(app)
      .delete(`/api/account/addresses/${address.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect(await UserAddressFactory.find(address.id)).toBeNull();
  });

  it("promotes another same-type address after deleting the default", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const defaultAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });
    const replacement = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: false,
    });
    const otherTypeAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.BILLING,
      isDefault: true,
    });

    const response = await request(app)
      .delete(`/api/account/addresses/${defaultAddress.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect(await UserAddressFactory.find(defaultAddress.id)).toBeNull();
    expect((await UserAddressFactory.find(replacement.id))?.isDefault).toBe(
      true,
    );
    expect(
      (await UserAddressFactory.find(otherTypeAddress.id))?.isDefault,
    ).toBe(true);
  });

  it("deletes the address without changing defaults of another type", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const shippingAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });
    const billingAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.BILLING,
      isDefault: true,
    });

    const response = await request(app)
      .delete(`/api/account/addresses/${shippingAddress.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect((await UserAddressFactory.find(billingAddress.id))?.isDefault).toBe(
      true,
    );
  });

  it("returns not found when trying to delete another user's address", async () => {
    const [{ accessToken }, { user }] = await Promise.all([
      createAuthenticatedUser(),
      createAuthenticatedUser(),
    ]);
    const address = await UserAddressFactory.create(user.id);

    const response = await request(app)
      .delete(`/api/account/addresses/${address.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ADDRESS_NOT_FOUND");
    expect(await UserAddressFactory.find(address.id)).not.toBeNull();
  });

  it("rejects an invalid address id", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .delete("/api/account/addresses/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
  });

  it("rejects unauthenticated address deletion", async () => {
    const response = await request(app).delete(
      "/api/account/addresses/13d84e90-646d-42b8-8ba2-441338db58f6",
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
