import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("PATCH /api/account", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("updates the authenticated user's account", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.patch("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ fullname: "Updated Auth User", companyName: "Updated Co" });

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			id: auth.user.id,
			fullname: "Updated Auth User",
			companyName: "Updated Co",
		});
		expect(response.body.data).not.toHaveProperty("passwordHash");

		const updatedUser = await UserFactory.get(auth.user.id);
		expect(updatedUser?.fullname).toBe("Updated Auth User");
		expect(updatedUser?.companyName).toBe("Updated Co");
	});

	it("requires an access token", async () => {
		const response = await supertest(app)
			.patch("/api/account")
			.send({ fullname: "Updated Auth User" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.patch("/api/account")
			.set("Authorization", "Bearer invalid-token")
			.send({ fullname: "Updated Auth User" });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("returns not found when updating a deleted account", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.patch("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`)
			.send({ fullname: "Updated Auth User" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
	});
});
