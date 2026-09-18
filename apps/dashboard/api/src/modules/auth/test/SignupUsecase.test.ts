import { beforeEach, describe, expect, it, vi } from "vitest";
import SignupUsecase from "../application/usecase/SignupUsecase.js";
import { EmailAlreadyExists } from "../error/auth.errors.js";

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
  signAccessToken: vi.fn(),
}));

vi.mock("@payvo/shared/crypto", () => ({
  hashPassword: mocks.hashPassword,
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

describe("SignupUsecase", () => {
  const userRepository = {
    findByEmailIncludingDeleted: vi.fn(),
    create: vi.fn(),
  };
  const sessionRepository = { create: vi.fn() };
  const refreshTokenRepository = { create: vi.fn() };
  const usecase = new SignupUsecase(
    userRepository as never,
    sessionRepository as never,
    refreshTokenRepository as never,
  );

  const input = {
    email: "user@example.com",
    password: "Password123!",
    fullname: "Test User",
    companyName: null,
    client: { userAgent: "vitest", ipAddress: "127.0.0.1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findByEmailIncludingDeleted.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    userRepository.create.mockResolvedValue({ id: "user-1" });
    sessionRepository.create.mockResolvedValue({ id: "session-1" });
    refreshTokenRepository.create.mockResolvedValue({ id: "refresh-1" });
    mocks.generateRefreshToken.mockReturnValue("raw-refresh-token");
    mocks.hashRefreshToken.mockReturnValue("hashed-refresh-token");
    mocks.signAccessToken.mockResolvedValue("access-token");
  });

  it("creates a user session and returns access and refresh tokens", async () => {
    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "raw-refresh-token",
    });

    expect(userRepository.findByEmailIncludingDeleted).toHaveBeenCalledWith(
      input.email,
    );
    expect(mocks.hashPassword).toHaveBeenCalledWith(input.password);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: input.email,
      passwordHash: "hashed-password",
      fullname: input.fullname,
      companyName: null,
    });
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

  it("rejects an email that is already associated with an account", async () => {
    userRepository.findByEmailIncludingDeleted.mockResolvedValue({
      id: "existing-user",
    });

    await expect(usecase.execute(input)).rejects.toBeInstanceOf(
      EmailAlreadyExists,
    );
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
