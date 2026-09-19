import request from "supertest";
import app from "../../src/app.js";
import type { TestUser } from "../factory/user.factory.js";

export const authPath = "/api/auth";

export interface AuthUserResult {
  user: TestUser;
  response: request.Response;
  accessToken: string;
  refreshToken: string;
  refreshCookie: string;
}

function getRefreshCookie(response: request.Response): string {
  const cookie = response.headers["set-cookie"]?.find((value) =>
    value.startsWith("refreshToken="),
  );

  if (!cookie) {
    throw new Error("Login response did not include a refresh token cookie");
  }

  return cookie.split(";", 1)[0];
}

export async function loginUser(user: TestUser): Promise<AuthUserResult> {
  const response = await request(app).post(`${authPath}/login`).send({
    email: user.email,
    password: user.password,
  });
  const refreshCookie = getRefreshCookie(response);
  const refreshToken = refreshCookie.slice("refreshToken=".length);

  return {
    user,
    response,
    accessToken: response.body.data.accessToken,
    refreshToken,
    refreshCookie,
  };
}
