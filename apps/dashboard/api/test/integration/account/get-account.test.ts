import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("GET /api/account", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("returns the authenticated user's account", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.get("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: auth.user.id,
			email: auth.user.email,
			fullname: auth.user.fullname,
			companyName: auth.user.companyName,
		});
		expect(response.body.data).not.toHaveProperty("passwordHash");
	});

	it("requires an access token", async () => {
		const response = await supertest(app).get("/api/account");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.get("/api/account")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("returns not found for a deleted account", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.get("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
	});
});
