import request from "supertest";
import resetDb from "../../helper/cleanup.js";
import { getAuthenticatedUser } from "../../helper/auth.helper.js";
import { MerchantFactory } from "../../factory/merchant.factory.js";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";

describe("DELETE /api/merchant/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("should return 204 and delete merchant from database for the owner", async () => {
    const { accessToken, user } = await getAuthenticatedUser({
      email: "delete.owner@example.com",
    });

    const merchant = await MerchantFactory.createMerchant({
      userId: user.id,
    });

    await request(app)
      .delete(`/api/merchant/${merchant.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const dbMerchant = await MerchantFactory.findMerchantById(merchant.id);
    expect(dbMerchant).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await getAuthenticatedUser();
    const nonExistentId = crypto.randomUUID();

    const res = await request(app)
      .delete(`/api/merchant/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // User mismatch
  // ---------------------------------------------------------------------------

  it("should return 403 and NOT delete merchant when owned by another user", async () => {
    const user1 = await getAuthenticatedUser({ email: "owner1@example.com" });
    const user2 = await getAuthenticatedUser({ email: "owner2@example.com" });

    const merchant = await MerchantFactory.createMerchant({
      userId: user1.user.id,
    });

    const res = await request(app)
      .delete(`/api/merchant/${merchant.id}`)
      .set("Authorization", `Bearer ${user2.accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");

    // Verify record still exists in database
    const dbMerchant = await MerchantFactory.findMerchantById(merchant.id);
    expect(dbMerchant).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Inactive merchant
  // ---------------------------------------------------------------------------

  it("should return 403 and NOT delete merchant when inactive", async () => {
    const { accessToken, user } = await getAuthenticatedUser();

    const inactiveMerchant = await MerchantFactory.createMerchant({
      userId: user.id,
      isActive: false,
    });

    const res = await request(app)
      .delete(`/api/merchant/${inactiveMerchant.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_INACTIVE");

    // Verify record still exists in database
    const dbMerchant = await MerchantFactory.findMerchantById(inactiveMerchant.id);
    expect(dbMerchant).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Path parameter validation
  // ---------------------------------------------------------------------------

  it("should return 400 when merchant id is not a valid UUID", async () => {
    const { accessToken } = await getAuthenticatedUser();

    const res = await request(app)
      .delete("/api/merchant/not-a-valid-uuid")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Authentication required
  // ---------------------------------------------------------------------------

  it("should return 401 when no authorization header is provided", async () => {
    const res = await request(app)
      .delete(`/api/merchant/${crypto.randomUUID()}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 for invalid access token", async () => {
    const res = await request(app)
      .delete(`/api/merchant/${crypto.randomUUID()}`)
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
