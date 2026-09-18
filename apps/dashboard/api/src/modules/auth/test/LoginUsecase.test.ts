import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginUsecase from "../application/usecase/LoginUsecase.js";
import { InvalidCredentialsError } from "../error/auth.errors.js";

const mocks = vi.hoisted(() => ({
  verifyPassword: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
  signAccessToken: vi.fn(),
}));

vi.mock("@payvo/shared/crypto", () => ({
  verifyPassword: mocks.verifyPassword,
}));
vi.mock("@payvo/shared/refresh-token", () => ({
  generateRefreshToken: mocks.generateRefreshToken,
  hashRefreshToken: mocks.hashRefreshToken,
}));
vi.mock("@payvo/shared/jwt", () => ({
  signAccessToken: mocks.signAccessToken,
}));
vi.mock("@payvo/config/auth", () => ({
  jwtConfig: {
    accessToken: { secret: "test-secret", expiryMinutes: 15 },
  },
  sessionConfig: { sessionExpiryDays: 7 },
}));

describe("LoginUsecase", () => {
  const userRepository = { findByEmail: vi.fn() };
  const sessionRepository = { create: vi.fn() };
  const refreshTokenRepository = { create: vi.fn() };
  const usecase = new LoginUsecase(
    userRepository as never,
    sessionRepository as never,
    refreshTokenRepository as never,
  );

  const input = {
    email: "user@example.com",
    password: "Password123!",
    client: { userAgent: "vitest", ipAddress: "127.0.0.1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "stored-password-hash",
    });
    mocks.verifyPassword.mockResolvedValue(true);
    sessionRepository.create.mockResolvedValue({ id: "session-1" });
    refreshTokenRepository.create.mockResolvedValue({ id: "refresh-1" });
    mocks.generateRefreshToken.mockReturnValue("raw-refresh-token");
    mocks.hashRefreshToken.mockReturnValue("hashed-refresh-token");
    mocks.signAccessToken.mockResolvedValue("access-token");
  });

  it("authenticates the user and creates a session with tokens", async () => {
    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "raw-refresh-token",
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      input.password,
      "stored-password-hash",
    );
    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        userAgent: input.client.userAgent,
        ipAddress: input.client.ipAddress,
        expiresAt: expect.any(String),
      }),
    );
    expect(refreshTokenRepository.create).toHaveBeenCalledWith({
      sessionId: "session-1",
      tokenHash: "hashed-refresh-token",
    });
    expect(mocks.signAccessToken).toHaveBeenCalledWith(
      { sub: "user-1", sid: "session-1" },
      expect.objectContaining({ secret: expect.any(String) }),
    );
  });

  it.each([
    ["an unknown email", null],
    ["an incorrect password", { id: "user-1", passwordHash: "stored-hash" }],
  ])("rejects login with %s", async (_reason, user) => {
    userRepository.findByEmail.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(sessionRepository.create).not.toHaveBeenCalled();
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });
});
