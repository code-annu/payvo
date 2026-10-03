import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import MerchantFactory from "../../factory/merchant.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("DELETE /api/merchants/:merchantId", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("deletes a merchant owned by the authenticated user", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "delete-merchant-mid",
			userId: auth.user.id,
		});

		const response = await supertest(app)
			.delete(`/api/merchants/${merchant.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(204);
		expect(response.text).toBe("");
		expect(await MerchantFactory.get(merchant.id)).toBeNull();
	});

	it("requires an access token", async () => {
		const response = await supertest(app).delete(
			"/api/merchants/00000000-0000-4000-8000-000000000000",
		);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.delete("/api/merchants/00000000-0000-4000-8000-000000000000")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("rejects a token for a user that no longer exists", async () => {
		const auth = await loginUser();
		await UserFactory.delete(auth.user.id);

		const response = await supertest(app)
			.delete("/api/merchants/00000000-0000-4000-8000-000000000000")
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
			.delete("/api/merchants/00000000-0000-4000-8000-000000000000")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("returns not found for a merchant that does not exist", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.delete("/api/merchants/00000000-0000-4000-8000-000000000000")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MERCHANT_NOT_FOUND");
	});

	it("deletes an inactive merchant", async () => {
		const auth = await loginUser();
		const merchant = await MerchantFactory.create({
			mid: "inactive-delete-merchant-mid",
			userId: auth.user.id,
		});
		await MerchantFactory.update(merchant.id, { isActive: false });

		const response = await supertest(app)
			.delete(`/api/merchants/${merchant.id}`)
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(204);
		expect(response.text).toBe("");
		expect(await MerchantFactory.get(merchant.id)).toBeNull();
	});
});