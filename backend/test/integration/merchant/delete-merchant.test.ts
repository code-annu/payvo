import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import MerchantFactory from "../../factory/merchant.factory";
import { prisma } from "@/core/prisma/prisma.client";

const MERCHANTS_URL = "/api/merchants";

describe("DELETE /api/merchants/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should delete merchant and return 204", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(authUser.user.id);

    const res = await request(app)
      .delete(`${MERCHANTS_URL}/${merchant.id}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(204);

    // Verify deleted in DB
    const dbMerchant = await prisma.merchant.findUnique({
      where: { id: merchant.id },
    });
    expect(dbMerchant).toBeNull();
  });

  // ── Not found / Isolation ──────────────────────────────────────────

  it("should return 404 with MERCHANT_NOT_FOUND if merchant does not exist", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();
    const nonExistentId = "a0000000-0000-4000-a000-000000000000";

    const res = await request(app)
      .delete(`${MERCHANTS_URL}/${nonExistentId}`)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 403 with MERCHANT_ACCESS_DENIED if merchant belongs to another user", async () => {
    const { authUser: user1 } = await AuthHelper.getAuthenticatedUser();
    const { authUser: user2 } = await AuthHelper.getAuthenticatedUser();
    const merchant = await MerchantFactory.createMerchant(user2.user.id);

    const res = await request(app)
      .delete(`${MERCHANTS_URL}/${merchant.id}`)
      .set("Authorization", `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_ACCESS_DENIED");

    // Verify NOT deleted in DB
    const dbMerchant = await prisma.merchant.findUnique({
      where: { id: merchant.id },
    });
    expect(dbMerchant).not.toBeNull();
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).delete(
      `${MERCHANTS_URL}/a0000000-0000-4000-a000-000000000000`,
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .delete(`${MERCHANTS_URL}/a0000000-0000-4000-a000-000000000000`)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
