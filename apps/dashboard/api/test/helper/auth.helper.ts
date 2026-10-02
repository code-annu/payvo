import { client } from "@payvo/database/client";
import type {
	RefreshToken,
	Session,
	User,
} from "@payvo/database/types";
import { hashPassword } from "@payvo/shared/crypto";
import supertest from "supertest";
import app from "../../src/app.js";
import UserFactory from "../factory/user.factory.js";

export const authCredentials = {
	email: "auth-user@example.com",
	password: "StrongPass1!",
	fullname: "Auth Test User",
};

export interface AuthenticatedUser {
	accessToken: string;
	refreshToken: string;
	user: User;
	session: Session;
	refreshTokenRecord: RefreshToken;
}

export async function loginUser(): Promise<AuthenticatedUser> {
	const user = await UserFactory.create({
		email: authCredentials.email,
		passwordHash: await hashPassword(authCredentials.password),
		fullname: authCredentials.fullname,
		companyName: null,
	});

	const response = await supertest(app)
		.post("/api/auth/login")
		.send({ email: authCredentials.email, password: authCredentials.password });

	if (response.status !== 200) {
		throw new Error(`Test user login failed with status ${response.status}`);
	}

	const accessToken = response.body.data?.accessToken;
	const refreshCookie = response.headers["set-cookie"]?.find((cookie) =>
		cookie.startsWith("refreshToken="),
	);
	const refreshToken = refreshCookie
		?.split(";")[0]
		?.slice("refreshToken=".length);

	if (typeof accessToken !== "string" || !refreshToken) {
		throw new Error("Test user login did not return authentication tokens");
	}

	const sessions = await client.orm.public.Session.where({
		userId: user.id,
	}).all();
	const session = sessions[0];
	if (!session) {
		throw new Error("Test user login did not create a session");
	}

	const refreshTokens = await client.orm.public.RefreshToken.where({
		sessionId: session.id,
	}).all();
	const refreshTokenRecord = refreshTokens[0];
	if (!refreshTokenRecord) {
		throw new Error("Test user login did not create a refresh-token record");
	}

	return { accessToken, refreshToken, user, session, refreshTokenRecord };
}
