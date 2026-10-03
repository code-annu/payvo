import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/merchants/:merchantId", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns details for a merchant owned by the authenticated user", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "merchant-details-mid",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: merchant.id,
			mid: merchant.mid,
			userId: auth.user.id,
			isActive: merchant.isActive,
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app).get("/api/merchants/merchant-1");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get("/api/merchants/merchant-1")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.get("/api/merchants/merchant-1")
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
			.get("/api/merchants/merchant-1")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("returns not found for a merchant that does not exist", async () => {
		const auth = await loginUser();
		const missingMerchantId = "00000000-0000-4000-8000-000000000000";

		const response = await supertest(app)
			.get(`/api/merchants/${missingMerchantId}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("does not return a merchant owned by another user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-merchant-details@example.com",
			passwordHash: "test-hash",
			fullname: "Other Merchant Details Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-merchant-details-mid",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an invalid merchant id", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/not-a-uuid")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
	});
});
