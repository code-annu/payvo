import app from "@/app.js";
import type { User } from "@payvo/database/types";
import request from "supertest";
import { randomUUID } from "node:crypto";
import UserFactory from "../factory/user.factory.js";

const password = "StrongPass1!";

export interface AuthenticatedUser {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function createAuthenticatedUser(
  email = `auth-${randomUUID()}@example.com`,
): Promise<AuthenticatedUser> {
  const response = await request(app)
    .post("/api/auth/signup")
    .send({ email, password });

  if (response.status !== 201) {
    throw new Error(
      `Could not create an authenticated test user: ${response.status}`,
    );
  }

  const accessToken: unknown = response.body.data?.accessToken;
  const refreshCookie = String(response.headers["set-cookie"]).match(
    /refreshToken=([^;]+)/,
  )?.[1];
  const user = await UserFactory.findByEmail(email);

  if (typeof accessToken !== "string" || !refreshCookie || !user) {
    throw new Error("Signup did not return the expected authenticated user");
  }

  return { user, accessToken, refreshToken: refreshCookie };
}
