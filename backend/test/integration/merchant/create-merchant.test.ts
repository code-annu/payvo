import app from "@/app";
import request from "supertest";
import { resetDb } from "../../helper/cleanup";
import AuthHelper from "../../helper/auth.helper";
import { prisma } from "@/core/prisma/prisma.client";

const MERCHANTS_URL = "/api/merchants";

describe("POST /api/merchants", () => {
  beforeEach(async () => {
    await resetDb();
  });

  // ── Happy path ─────────────────────────────────────────────────────

  it("should create a merchant and return 201 with merchant data", async () => {
    const { authUser } = await AuthHelper.getAuthenticatedUser();

    const res = await request(app)
      .post(MERCHANTS_URL)
      .set("Authorization", `Bearer ${authUser.accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.merchant).toBeDefined();
    expect(res.body.data.merchant.id).toBeDefined();
    expect(res.body.data.merchant.userId).toBe(authUser.user.id);
    expect(res.body.data.merchant.isActive).toBe(true);
    expect(res.body.data.merchant.createdAt).toBeDefined();

    // Verify persisted in DB
    const dbMerchant = await prisma.merchant.findUnique({
      where: { id: res.body.data.merchant.id },
    });
    expect(dbMerchant).not.toBeNull();
    expect(dbMerchant?.userId).toBe(authUser.user.id);
  });

  // ── Missing / invalid token ────────────────────────────────────────

  it("should return 401 if no Authorization header is provided", async () => {
    const res = await request(app).post(MERCHANTS_URL);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });

  it("should return 401 if access token is invalid", async () => {
    const res = await request(app)
      .post(MERCHANTS_URL)
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
  });
});
