import request from "supertest";
import app from "../../src/app.js";

interface AuthDetails {
  accessToken: string;
  refreshTokenCookie: string;
  user: {
    id: string;
    fullname: string;
    companyName: string | null;
    isEmailVerified: boolean;
    createdAt: string;
  };
}

export default abstract class AuthHelper {
  private static counter = 0;

  /**
   * Creates a new user via the signup endpoint and returns auth details.
   * Each call generates a unique email to avoid collisions.
   */
  static async getAuthUser(
    overrides: {
      email?: string;
      password?: string;
      fullname?: string;
      companyName?: string;
    } = {},
  ): Promise<AuthDetails> {
    AuthHelper.counter++;
    const email =
      overrides.email ?? `testuser${AuthHelper.counter}+${Date.now()}@test.com`;
    const password = overrides.password ?? "StrongP@ss1";
    const fullname = overrides.fullname ?? "Test User";
    const companyName = overrides.companyName ?? "Test Corp";

    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ email, password, fullname, companyName })
      .expect(201);

    const accessToken: string = signupRes.body.data.accessToken;
    const cookies: string[] = (signupRes.headers["set-cookie"] as any) ?? [];
    const refreshTokenCookie =
      cookies.find((c: string) => c.startsWith("refreshToken=")) ?? "";

    return {
      accessToken,
      refreshTokenCookie,
      user: signupRes.body.data.user,
    };
  }
}
