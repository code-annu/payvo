import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import WebhookFactory from "../../factory/webhook.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/merchants/:merchantId/webhooks", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns the merchant's webhooks without exposing their secret keys", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "get-webhooks-merchant",
			userId: auth.user.id,
		});
		const webhook = await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "webhook-secret",
			url: "https://example.com/first",
		});
		await WebhookFactory.create({
			merchantId: merchant.id,
			secretKey: "another-webhook-secret",
			url: "https://example.com/second",
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			merchantId: merchant.id,
			webhooks: expect.arrayContaining([
				{ id: webhook.id, url: webhook.url },
				{ id: expect.any(String), url: "https://example.com/second" },
			]),
		});
		expect(response.body.data.webhooks).toHaveLength(2);
		for (const listedWebhook of response.body.data.webhooks) {
			expect(listedWebhook).not.toHaveProperty("secretKey");
		}
	});

	it("returns an empty list when the merchant has no webhooks", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "empty-webhooks-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toEqual({
			merchantId: merchant.id,
			webhooks: [],
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app).get(
			"/api/merchants/00000000-0000-4000-8000-000000000000/webhooks",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
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
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-list-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other List Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-list-owner-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-list-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.get(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it("rejects an invalid merchant id", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.get("/api/merchants/not-a-uuid/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(400);
	});
});
