import app from "@/app.js";
import { UserAddressType } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import UserAddressFactory from "../../../factory/user-address.factory.js";
import { createAuthenticatedUser } from "../../../helper/auth.helper.js";
import { createAddressRequestBody } from "../../../helper/address.helper.js";
import { setupDb } from "../../../helper/setupDb.js";

describe("POST /api/account/addresses", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("adds a default address", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const body = createAddressRequestBody({ isDefault: true });

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Address created successfully",
      data: {
        userId: user.id,
        ...body,
      },
    });

    const [stored] = await UserAddressFactory.findByUserId(user.id);
    expect(stored?.isDefault).toBe(true);
    expect(stored?.addressType).toBe(body.addressType);
  });

  it("adds a non-default address", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const body = createAddressRequestBody();

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body.data.isDefault).toBe(false);
    expect(await UserAddressFactory.findByUserId(user.id)).toHaveLength(1);
  });

  it("leaves an existing non-default address unchanged when adding a default of the same type", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const existing = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: false,
    });

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAddressRequestBody({ isDefault: true }));

    expect(response.status).toBe(201);
    expect((await UserAddressFactory.find(existing.id))?.isDefault).toBe(false);
    const stored = await UserAddressFactory.findByUserId(user.id);
    expect(stored.filter((address) => address.isDefault)).toHaveLength(1);
    expect(stored.find((address) => address.isDefault)?.id).toBe(
      response.body.data.id,
    );
  });

  it("replaces an existing default of the same type", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const existing = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAddressRequestBody({ isDefault: true }));

    expect(response.status).toBe(201);
    expect((await UserAddressFactory.find(existing.id))?.isDefault).toBe(false);
    const stored = await UserAddressFactory.findByUserId(user.id);
    expect(stored.filter((address) => address.isDefault)).toHaveLength(1);
    expect(stored.find((address) => address.isDefault)?.id).toBe(
      response.body.data.id,
    );
  });

  it("rejects a second default address of the same type at the database level", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const firstDefault = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });

    await expect(
      UserAddressFactory.create(user.id, {
        addressType: UserAddressType.SHIPPING,
        street1: "Second Default Street",
        isDefault: true,
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    expect(await UserAddressFactory.findByUserId(user.id)).toEqual([
      expect.objectContaining({ id: firstDefault.id, isDefault: true }),
    ]);

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAddressRequestBody({ isDefault: true }));

    expect(response.status).toBe(201);
    expect((await UserAddressFactory.find(firstDefault.id))?.isDefault).toBe(
      false,
    );
  });

  it("keeps defaults independent for each address type", async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const billingAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.BILLING,
      isDefault: true,
    });
    const previousShippingAddress = await UserAddressFactory.create(user.id, {
      addressType: UserAddressType.SHIPPING,
      isDefault: true,
    });

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(createAddressRequestBody({ isDefault: true }));

    expect(response.status).toBe(201);
    expect((await UserAddressFactory.find(billingAddress.id))?.isDefault).toBe(
      true,
    );
    expect(
      (await UserAddressFactory.find(previousShippingAddress.id))?.isDefault,
    ).toBe(false);
    const stored = await UserAddressFactory.findByUserId(user.id);
    expect(
      stored.filter(
        (address) =>
          address.addressType === UserAddressType.SHIPPING && address.isDefault,
      ),
    ).toHaveLength(1);
  });

  it.each([
    {},
    { addressType: "UNKNOWN" },
    { ...createAddressRequestBody(), street1: "" },
    { ...createAddressRequestBody(), countryCode: "USA" },
    { ...createAddressRequestBody(), isDefault: "true" },
  ])("rejects a missing or invalid request body: %o", async (body) => {
    const { accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/account/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects unauthenticated address creation", async () => {
    const response = await request(app)
      .post("/api/account/addresses")
      .send(createAddressRequestBody());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
