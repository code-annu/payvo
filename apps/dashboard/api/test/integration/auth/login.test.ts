import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app.js";
import { setupDb } from "../../helper/setupDb.js";
import { authCredentials, loginUser } from "../../helper/auth.helper.js";

describe("POST /api/auth/login", () => {
	beforeEach(async () => {
		await setupDb();
	});

	afterEach(async () => {
		await setupDb();
	});

	it("logs in an existing user", async () => {
		const auth = await loginUser();

		expect(auth.accessToken).toEqual(expect.any(String));
		expect(auth.refreshToken).toEqual(expect.any(String));
		expect(auth.user.email).toBe(authCredentials.email);
	});

	it("rejects an invalid email", async () => {
		const response = await supertest(app)
			.post("/api/auth/login")
			.send({ email: "not-an-email", password: authCredentials.password });

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["email"] }),
			]),
		);
	});

	it("rejects an invalid password", async () => {
		await loginUser();

		const response = await supertest(app)
			.post("/api/auth/login")
			.send({ email: authCredentials.email, password: "WrongPassword1!" });

		expect(response.status).toBe(401);
		expect(response.body.success).toBe(false);
		expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
	});

	it("rejects missing fields", async () => {
		const response = await supertest(app).post("/api/auth/login").send({});

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: ["email"] }),
				expect.objectContaining({ field: ["password"] }),
			]),
		);
	});
});