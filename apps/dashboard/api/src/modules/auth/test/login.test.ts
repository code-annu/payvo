import "reflect-metadata";
import type UserRepository from "../../user/repository/user.repository.js";
import type SessionRepository from "../repository/session.repository.js";
import type RefreshTokenRepository from "../repository/refresh-token.repository.js";
import { InvalidCredentialsError } from "../error/auth.errors.js";
import type { LoginDto } from "../dto/LoginDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import type { RefreshToken } from "../entity/refresh-token.entity.js";

vi.mock("@payvo/database/client", () => ({
  client: {},
}));

vi.mock("@payvo/database/types", () => ({}));

vi.mock("@payvo/shared/crypto", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@payvo/shared/refresh-token", () => ({
  generateRefreshToken: vi.fn().mockReturnValue("raw-refresh-token-stub"),
  hashRefreshToken: vi.fn().mockReturnValue("hashed-refresh-token-stub"),
}));

vi.mock("@payvo/shared/jwt", () => ({
  signAccessToken: vi.fn().mockResolvedValue("access-token-stub"),
}));

vi.mock("@payvo/config/auth", () => ({
  jwtConfig: {
    accessToken: { secret: "test-secret", expiryMinutes: 15 },
  },
  sessionConfig: { sessionExpiryDays: 7 },
}));

import { verifyPassword } from "@payvo/shared/crypto";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import AuthService from "../auth.service.js";

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeUser: User = {
  id: "user-1",
  email: "john@example.com",
  passwordHash: "$argon2-hashed-password",
  fullname: "John Doe",
  companyName: "Acme Inc",
  isEmailVerified: false,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const fakeSession: Session = {
  id: "session-1",
  userId: fakeUser.id,
  userAgent: "Mozilla/5.0",
  ipAddress: "127.0.0.1",
  revokedAt: null,
  expiresAt: new Date("2026-09-17T00:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
};

const fakeRefreshToken: RefreshToken = {
  id: "rt-1",
  tokenHash: "hashed-refresh-token-stub",
  sessionId: fakeSession.id,
  revokedById: null,
  revokedAt: null,
  createdAt: now,
};

const loginInput: LoginDto = {
  email: "john@example.com",
  password: "Str0ng!Pass",
  client: {
    userAgent: "Mozilla/5.0",
    ipAddress: "127.0.0.1",
  },
};

function createMockUserRepo(): UserRepository {
  return {
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as UserRepository;
}

function createMockSessionRepo(): SessionRepository {
  return {
    create: vi.fn(),
    revokeForLogout: vi.fn(),
    extendExpiryDate: vi.fn(),
  } as unknown as SessionRepository;
}

function createMockRefreshTokenRepo(): RefreshTokenRepository {
  return {
    create: vi.fn(),
    findForRotation: vi.fn(),
    revokeForRotation: vi.fn(),
    revokeForLogout: vi.fn(),
  } as unknown as RefreshTokenRepository;
}

describe("AuthService.login", () => {
  let authService: AuthService;
  let userRepo: UserRepository;
  let sessionRepo: SessionRepository;
  let refreshTokenRepo: RefreshTokenRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = createMockUserRepo();
    sessionRepo = createMockSessionRepo();
    refreshTokenRepo = createMockRefreshTokenRepo();
    authService = new (AuthService as any)(userRepo, sessionRepo, refreshTokenRepo);
  });

  it("returns access, refresh token, and session on successful login", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.login(loginInput);

    expect(result).toEqual({
      accessToken: "access-token-stub",
      refreshToken: "raw-refresh-token-stub",
      session: fakeSession,
    });
  });

  it("looks up the user by email before verification", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(userRepo.findByEmail).toHaveBeenCalledWith(loginInput.email);
  });

  it("throws InvalidCredentialsError when the user does not exist", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(authService.login(loginInput)).rejects.toThrow(InvalidCredentialsError);
  });

  it("throws InvalidCredentialsError when the password is invalid", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(authService.login(loginInput)).rejects.toThrow(InvalidCredentialsError);
  });

  it("verifies the password with the stored hash", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(verifyPassword).toHaveBeenCalledWith(loginInput.password, fakeUser.passwordHash);
  });

  it("creates a session with the client metadata", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser.id,
        userAgent: loginInput.client.userAgent,
        ipAddress: loginInput.client.ipAddress,
      }),
    );
  });

  it("creates a refresh token hash and saves it", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(generateRefreshToken).toHaveBeenCalledTimes(1);
    expect(hashRefreshToken).toHaveBeenCalledWith("raw-refresh-token-stub");
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      sessionId: fakeSession.id,
      tokenHash: "hashed-refresh-token-stub",
    });
  });

  it("signs the access token with the user and session ids", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(signAccessToken).toHaveBeenCalledWith(
      { sub: fakeUser.id, sid: fakeSession.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("propagates repository errors", async () => {
    vi.mocked(userRepo.findByEmail).mockRejectedValue(new Error("DB connection lost"));

    await expect(authService.login(loginInput)).rejects.toThrow("DB connection lost");
  });
});
