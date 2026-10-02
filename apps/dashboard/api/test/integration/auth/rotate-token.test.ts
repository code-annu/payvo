import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { client } from "@payvo/database/client";
import app from "../../../src/app.js";
import RefreshTokenFactory from "../../factory/refresh-token.factory.js";
import SessionFactory from "../../factory/session.factory.js";
import UserFactory from "../../factory/user.factory.js";
import { loginUser } from "../../helper/auth.helper.js";
import { setupDb } from "../../helper/setupDb.js";

describe("POST /api/auth/rotate-token", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("rotates a valid refresh token", async () => {
		const auth = await loginUser();

		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.set("Cookie", `refreshToken=${auth.refreshToken}`);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.data.accessToken).toEqual(expect.any(String));
		expect(response.headers["set-cookie"]).toEqual(
			expect.arrayContaining([expect.stringContaining("refreshToken=")]),
		);

		const oldRefreshToken = await RefreshTokenFactory.get(
			auth.refreshTokenRecord.id,
		);
		expect(oldRefreshToken?.revokedAt).not.toBeNull();
		const refreshTokens = await client.orm.public.RefreshToken.where({
			sessionId: auth.session.id,
		}).all();
		expect(refreshTokens).toHaveLength(2);
	});

	it("requires a refresh token", async () => {
		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.send({});

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["refreshToken"] }),
			]),
		);
	});

	it("rejects an invalid refresh token", async () => {
		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.set("Cookie", "refreshToken=invalid-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
	});

	it("rejects a revoked refresh token", async () => {
		const auth = await loginUser();
		await RefreshTokenFactory.update(auth.refreshTokenRecord.id, {
			revokedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.set("Cookie", `refreshToken=${auth.refreshToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("REVOKED_REFRESH_TOKEN");
	});

	it("rejects a refresh token for a revoked session", async () => {
		const auth = await loginUser();
		await SessionFactory.update(auth.session.id, {
			revokedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.set("Cookie", `refreshToken=${auth.refreshToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("REVOKED_SESSION");
	});

	it("rejects a refresh token for a deleted user", async () => {
		const auth = await loginUser();
		await UserFactory.update(auth.user.id, {
			deletedAt: new Date().toISOString(),
		});

		const response = await supertest(app)
			.post("/api/auth/rotate-token")
			.set("Cookie", `refreshToken=${auth.refreshToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});
});
