import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";
import SessionFactory from "../../factory/session.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/auth/logout", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("logs out and revokes the session tokens", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.post("/api/auth/logout")
			.set("Authorization", `Bearer ${auth.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.message).toBe("Logged out successfully");

		const session = await SessionFactory.get(auth.session.id);
		const refreshToken = await RefreshTokenFactory.get(
			auth.refreshTokenRecord.id,
		);
		expect(session?.revokedAt).not.toBeNull();
		expect(refreshToken?.revokedAt).not.toBeNull();
	});

	it("requires an access token", async () => {
		const response = await supertest(app).post("/api/auth/logout");

		expect(response.status).toBe(401);
		expect(response.body.success).toBe(false);
		expect(response.body.error.code).toBe("MISSING_ACCESS_TOKEN");
	});

	it("rejects an invalid access token", async () => {
		const response = await supertest(app)
			.post("/api/auth/logout")
			.set("Authorization", "Bearer invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.success).toBe(false);
		expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
	});
});
