import app from "@/app";
import request from "supertest";
import UserFactory from "../factory/user.factory";

interface AuthUser {
  accessToken: string;
  user: { id: string; email: string; isEmailVerified: boolean };
}

export default abstract class AuthHelper {
  static async getAuthenticatedUser(): Promise<{
    authUser: AuthUser;
    cookies: any;
  }> {
    const email = `test_${crypto.randomUUID()}@example.com`;
    const password = "Peter@1234";
    await UserFactory.createUser(email, password);
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);
    const cookies = response.headers["set-cookie"];

    return {
      authUser: response.body.data ?? response.body,
      cookies,
    };
  }
}
