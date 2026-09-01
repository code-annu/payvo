import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { LoginDto } from "../dto/LoginDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import { InvalidCredentialsError } from "../error/auth.errors.js";
import { verifyPassword } from "@payvo/shared/crypto";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/auth/refresh-token";
import { signAccessToken } from "@payvo/shared/auth/jwt";

// ── Mock @payvo/config/auth so tests don't depend on real env vars ──
vi.mock("@payvo/config/auth", () => ({
  jwtConfig: {
    accessToken: { secret: "test-secret", expiryMinutes: 15 },
  },
  sessionConfig: {
    refreshToken: { expiryDays: 7 },
  },
}));

// ── Mock @payvo/database to prevent Prisma from connecting ─────────
vi.mock("@payvo/database", () => ({
  db: {},
}));

// ── Mock @payvo/shared functional helpers ──────────────────────────
vi.mock("@payvo/shared/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("@payvo/shared/auth/refresh-token", () => ({
  generateRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
  hashRefreshToken: vi.fn().mockReturnValue("mock-token-hash"),
}));

vi.mock("@payvo/shared/auth/jwt", () => ({
  signAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
  verifyAccessToken: vi.fn(),
}));

// ── Factories ──────────────────────────────────────────────────────
function createMockUserRepo(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createUser: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
    softDeleteUser: vi.fn(),
    restoreUser: vi.fn(),
    ...overrides,
  } as unknown as UserRepository;
}

function createMockSessionRepo(
  overrides: Partial<SessionRepository> = {},
): SessionRepository {
  return {
    createSession: vi.fn(),
    findSessionById: vi.fn(),
    findBySessionsByUserId: vi.fn(),
    findSessionByTokenHash: vi.fn(),
    updateSession: vi.fn(),
    revokeSession: vi.fn(),
    revokeSessionByUserId: vi.fn(),
    ...overrides,
  } as unknown as SessionRepository;
}

// ── Fixtures ───────────────────────────────────────────────────────
const now = new Date("2026-08-30T12:00:00Z");

const loginInput: LoginDto = {
  email: "john@example.com",
  password: "StrongP@ss1",
  userAgent: "Mozilla/5.0",
  ipAddress: "192.168.1.1",
};

const fakeUser: User = {
  id: "user-1",
  email: loginInput.email,
  passwordHash: "hashed-password",
  fullname: "John Doe",
  companyName: "Acme Inc",
  isEmailVerified: false,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const fakeSession: Session = {
  id: "session-1",
  user: {
    id: fakeUser.id,
    email: fakeUser.email,
    isEmailVerified: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  userAgent: loginInput.userAgent!,
  ipAddress: loginInput.ipAddress!,
  revokedAt: null,
  expiresAt: new Date("2026-09-06T00:00:00Z"),
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("AuthService.login", () => {
  let authService: AuthService;
  let userRepo: ReturnType<typeof createMockUserRepo>;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(generateRefreshToken).mockReturnValue("mock-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("mock-token-hash");
    vi.mocked(signAccessToken).mockResolvedValue("mock-access-token");

    userRepo = createMockUserRepo({
      findUserByEmail: vi.fn().mockResolvedValue(fakeUser),
    });
    sessionRepo = createMockSessionRepo({
      createSession: vi.fn().mockResolvedValue(fakeSession),
    });

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
    );
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw InvalidCredentialsError when user is not found", async () => {
    vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);

    await expect(authService.login(loginInput)).rejects.toThrow(
      InvalidCredentialsError,
    );
    await expect(authService.login(loginInput)).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("should throw InvalidCredentialsError when password does not match", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(authService.login(loginInput)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it("should throw InvalidCredentialsError when user is soft-deleted", async () => {
    vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date("2026-08-29T00:00:00Z"),
    });

    await expect(authService.login(loginInput)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it("should not create session or tokens when credentials are invalid", async () => {
    vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);

    await authService.login(loginInput).catch(() => {});

    expect(sessionRepo.createSession).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should compare password with stored hash", async () => {
    await authService.login(loginInput);

    expect(verifyPassword).toHaveBeenCalledWith(
      loginInput.password,
      fakeUser.passwordHash,
    );
  });

  it("should generate a refresh token and hash it for the session", async () => {
    await authService.login(loginInput);

    expect(generateRefreshToken).toHaveBeenCalled();
    expect(hashRefreshToken).toHaveBeenCalledWith("mock-refresh-token");
  });

  it("should create a session with the correct data", async () => {
    await authService.login(loginInput);

    expect(sessionRepo.createSession).toHaveBeenCalledWith({
      userId: fakeUser.id,
      tokenHash: "mock-token-hash",
      userAgent: loginInput.userAgent,
      ipAddress: loginInput.ipAddress,
      expiresAt: expect.any(String),
    });
  });

  it("should pass null for userAgent and ipAddress when not provided", async () => {
    const inputWithoutMeta: LoginDto = {
      ...loginInput,
      userAgent: undefined,
      ipAddress: undefined,
    };

    await authService.login(inputWithoutMeta);

    expect(sessionRepo.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: null,
        ipAddress: null,
      }),
    );
  });

  it("should generate an access token with session and user IDs", async () => {
    await authService.login(loginInput);

    expect(signAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeUser.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return user, refreshToken, and accessToken on success", async () => {
    const result = await authService.login(loginInput);

    expect(result).toEqual({
      user: fakeUser,
      refreshToken: "mock-refresh-token",
      accessToken: "mock-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findUserByEmail).mockImplementation(async () => {
      callOrder.push("findUserByEmail");
      return fakeUser;
    });
    vi.mocked(verifyPassword).mockImplementation(async () => {
      callOrder.push("verifyPassword");
      return true;
    });
    vi.mocked(generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return "mock-refresh-token";
    });
    vi.mocked(hashRefreshToken).mockImplementation(() => {
      callOrder.push("hashRefreshToken");
      return "mock-token-hash";
    });
    vi.mocked(sessionRepo.createSession).mockImplementation(async () => {
      callOrder.push("createSession");
      return fakeSession;
    });
    vi.mocked(signAccessToken).mockImplementation(async () => {
      callOrder.push("signAccessToken");
      return "mock-access-token";
    });

    await authService.login(loginInput);

    expect(callOrder).toEqual([
      "findUserByEmail",
      "verifyPassword",
      "generateRefreshToken",
      "hashRefreshToken",
      "createSession",
      "signAccessToken",
    ]);
  });
});
