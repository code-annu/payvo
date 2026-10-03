import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import WebhookFactory from "../../factory/webhook.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/merchants/:merchantId/webhooks", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("creates a webhook for an owned merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "create-webhook-merchant",
			userId: auth.user.id,
		});
		const url = "https://example.com/webhooks";

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url });

		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: expect.any(String),
			merchantId: merchant.id,
			secretKey: expect.any(String),
			url,
		});

		const webhook = await WebhookFactory.get(response.body.data.id);
		expect(webhook).toMatchObject({
			merchantId: merchant.id,
			secretKey: response.body.data.secretKey,
			url,
		});
	});

	it("requires an access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", "Bearer invalid-token")
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects a merchant that does not exist", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.post("/api/merchants/00000000-0000-4000-8000-000000000000/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects a merchant not owned by the user", async () => {
		const auth = await loginUser();
		const otherUser = await UserFactory.create({
			email: "other-webhook-owner@example.com",
			passwordHash: "test-hash",
			fullname: "Other Webhook Owner",
			companyName: null,
		});
		const merchant = await MerchantFactory.create({
			mid: "other-webhook-owner-merchant",
			userId: otherUser.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("rejects an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-webhook-merchant",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe("MERCHANT_INACTIVE");
	});

	it.each([
		["a missing url", {}],
		["an invalid url", { url: "not-a-url" }],
	])("rejects %s", async (_description, body) => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "invalid-webhook-request-merchant",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.post(`/api/merchants/${merchant.id}/webhooks`)
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send(body);

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["url"] }),
			]),
		);
	});

	it("rejects an invalid merchant id", async () => {
		const auth = await loginUser();
		const response = await supertest(app)
			.post("/api/merchants/not-a-uuid/webhooks")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ url: "https://example.com/webhooks" });

		expect(response.status).toBe(400);
	});
});
