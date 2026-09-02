import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../src/app.js";
import cleanup from "../../helper/cleanup.js";
import AuthHelper from "../../helper/auth.helper.js";

describe("GET /api/merchants/:id/api-keys", () => {
  beforeEach(async () => {
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return 200 and the active api key for TEST environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    // Create merchant and generate api key
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const genRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    const generatedKeyId = genRes.body.data.keyId;

    // Fetch the active key
    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBe(generatedKeyId);
    expect(res.body.data.generatedOn).toBeDefined();
    // keySecret must NOT be returned for GET
    expect(res.body.data.keySecret).toBeUndefined();
  });

  it("should return 200 and the active api key for LIVE environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const genRes = await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    const generatedKeyId = genRes.body.data.keyId;

    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "LIVE" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.keyId).toBe(generatedKeyId);
    expect(res.body.data.generatedOn).toBeDefined();
    expect(res.body.data.keySecret).toBeUndefined();
  });

  it("should return TEST key independent from LIVE key", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "TEST" })
      .expect(201);

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ environment: "LIVE" })
      .expect(201);

    const testRes = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(200);

    const liveRes = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "LIVE" })
      .expect(200);

    expect(testRes.body.data.keyId).not.toBe(liveRes.body.data.keyId);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should return 404 when no active api key exists for the environment", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("API_KEY_NOT_FOUND");
  });

  it("should return 403 when authenticated user does not own the merchant", async () => {
    const { accessToken: accessToken1 } = await AuthHelper.getAuthUser();
    const { accessToken: accessToken2 } = await AuthHelper.getAuthUser();

    // User 1 creates merchant and generates a key
    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken1}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    await request(app)
      .post(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken1}`)
      .send({ environment: "TEST" })
      .expect(201);

    // User 2 tries to get the key
    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken2}`)
      .query({ environment: "TEST" })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_USER_MISMATCH");
  });

  it("should return 404 when merchant does not exist", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_NOT_FOUND");
  });

  it("should return 409 when merchant is inactive", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    // Inactivate the merchant
    await request(app)
      .patch(`/api/merchants/${merchantId}/inactivate`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MERCHANT_INACTIVE");
  });

  it("should return 400 when environment query param is missing", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when environment query param is invalid", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const createRes = await request(app)
      .post("/api/merchants")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    const merchantId = createRes.body.data.merchant.id;

    const res = await request(app)
      .get(`/api/merchants/${merchantId}/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "STAGING" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 400 when merchantId is not a valid UUID", async () => {
    const { accessToken } = await AuthHelper.getAuthUser();

    const res = await request(app)
      .get("/api/merchants/invalid-uuid/api-keys")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ environment: "TEST" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when no auth token is provided", async () => {
    const res = await request(app)
      .get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .query({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("should return 401 when invalid auth token is provided", async () => {
    const res = await request(app)
      .get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys")
      .set("Authorization", "Bearer invalid-token")
      .query({ environment: "TEST" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
