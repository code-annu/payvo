import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";
import SessionFactory from "../../factory/session.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("DELETE /api/account", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("soft-deletes the account and revokes its auth records", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.delete("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(204);
		expect(response.text).toBe("");

		const deletedUser = await UserFactory.get(auth.user.id);
		const revokedSession = await SessionFactory.get(auth.session.id);
		const revokedRefreshToken = await RefreshTokenFactory.get(
			auth.refreshTokenRecord.id,
		);
		expect(deletedUser?.deletedAt).not.toBeNull();
		expect(revokedSession?.revokedAt).not.toBeNull();
		expect(revokedRefreshToken?.revokedAt).not.toBeNull();
	});

	it("requires an access token", async () => {
		const response = await supertest(app).delete("/api/account");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.delete("/api/account")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});

	it("returns not found when deleting an already deleted account", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.delete("/api/account")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
	});
});
