import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import ApiKeyFactory from "../../factory/api-key.factory.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/merchants/:merchantId/api-keys/generate", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("generates an API key for an owned merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "generate-key-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: expect.any(String),
			keyId: expect.any(String),
			keySecret: expect.any(String),
			status: "ACTIVE",
			environment: "TEST",
			generatedAt: expect.any(String),
		});

		const apiKey = await ApiKeyFactory.get(response.body.data.id);
		expect(apiKey?.merchantId).toBe(merchant.id);
		expect(apiKey?.secretHash).not.toBe(response.body.data.keySecret);
	});

	it("requires an access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/generate")
			.send({ environment: "TEST" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/generate")
			.set("Authorization", "Bearer invalid-token")
			.send({ environment: "TEST" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/generate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/generate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/api-keys/generate")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

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
			mid: "other-owner-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-generate-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects when an active key already exists for the environment", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "existing-key-merchant",
			userId: auth.user.id,
		});
		await ApiKeyFactory.create({
			merchantId: merchant.id,
			keyId: "existing_test_key",
			secretHash: "existing-hash",
			environment: "TEST",
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "TEST" });

		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("API_KEY_ALREADY_EXISTS");
	});

	it("rejects an invalid environment", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-env-generate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ environment: "STAGING" });

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
			]),
		);
	});

	it("rejects a missing request body", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "missing-body-generate-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/api-keys/generate`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({});

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["environment"] }),
			]),
		);
	});
});