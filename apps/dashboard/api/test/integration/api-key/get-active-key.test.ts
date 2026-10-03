import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/merchants/:merchantId/api-keys/active", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns active key details for the merchant and environment", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "get-active-key-merchant",
			userId: auth.user.id,
		});
		const apiKey = await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "active_test_key",
			secretHash: "active-key-hash",
			environment: "TEST",
			lastUsedAt: "2026-01-01T00:00:00.000Z",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys/active`)
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: apiKey.id,
			keyId: apiKey.keyId,
			status: "ACTIVE",
			environment: "TEST",
			lastUsedAt: new Date(apiKey.lastUsedAt!).toISOString(),
			generatedAt: new Date(apiKey.createdAt).toISOString(),
		});
		expect(response.body.data).not.toHaveProperty("secretHash");
	});

	it("requires an access token", async () => {
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.query({ environment: "TEST" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.query({ environment: "TEST" })
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-owner-active-key-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys/active`)
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-active-key-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys/active`)
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects when no active key exists", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-active-key-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys/active`)
			.query({ environment: "TEST" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("API_KEY_NOT_FOUND");
	});

	it("rejects an invalid environment", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-env-active-key-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/api-keys/active`)
			.query({ environment: "STAGING" })
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
			]),
		);
	});

	it("rejects a missing environment query", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/active")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
			]),
		);
	});
});
