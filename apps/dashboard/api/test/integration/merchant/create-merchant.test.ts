import app from "@/app.js";
import { MerchantStatus } from "@payvo/database/types";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantFactory from "../../factory/merchant.factory.js";
import { createAuthenticatedUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

vi.setConfig({ testTimeout: 15_000 });

describe("POST /api/merchants", () => {
  beforeEach(async () => {
    await setupDb();
  });

  it("creates an active merchant for the authenticated user", async () => {
    const { user, accessToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Merchant created successfully",
      data: {
        userId: user.id,
        status: MerchantStatus.ACTIVE,
        closedAt: null,
      },
    });
    expect(response.body.data.mid).toMatch(/^[a-zA-Z0-9]+$/);

    const merchant = await MerchantFactory.find(response.body.data.id);
    expect(merchant).toMatchObject({
      id: response.body.data.id,
      userId: user.id,
      mid: response.body.data.mid,
      status: MerchantStatus.ACTIVE,
      closedAt: null,
    });
  });

  it("rejects unauthenticated merchant creation", async () => {
    const response = await request(app).post("/api/merchants");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
  });
});
