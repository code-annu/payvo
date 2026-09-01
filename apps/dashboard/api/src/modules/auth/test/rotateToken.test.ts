import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { Session } from "../entity/session.entity.js";
import {
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedSessionError,
} from "../error/auth.errors.js";
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
vi.mock("@payvo/shared/auth/refresh-token", () => ({
  generateRefreshToken: vi.fn().mockReturnValue("new-refresh-token"),
  hashRefreshToken: vi
    .fn()
    .mockImplementation((token: string) => `hashed-${token}`),
}));

vi.mock("@payvo/shared/auth/jwt", () => ({
  signAccessToken: vi.fn().mockResolvedValue("new-access-token"),
  verifyAccessToken: vi.fn(),
}));

// ── Factories ──────────────────────────────────────────────────────
function createMockUserRepo(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findUserByEmail: vi.fn(),
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
const futureDate = new Date("2026-09-06T00:00:00Z");
const pastDate = new Date("2026-08-01T00:00:00Z");

const fakeSession: Session = {
  id: "session-1",
  user: {
    id: "user-1",
    email: "john@example.com",
    isEmailVerified: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  userAgent: "Mozilla/5.0",
  ipAddress: "192.168.1.1",
  revokedAt: null,
  expiresAt: futureDate,
  createdAt: now,
  updatedAt: now,
};

const oldRefreshToken = "old-refresh-token";

// ── Tests ──────────────────────────────────────────────────────────
describe("AuthService.rotateToken", () => {
  let authService: AuthService;
  let userRepo: ReturnType<typeof createMockUserRepo>;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(generateRefreshToken).mockReturnValue("new-refresh-token");
    vi.mocked(hashRefreshToken).mockImplementation(
      (token: string) => `hashed-${token}`,
    );
    vi.mocked(signAccessToken).mockResolvedValue("new-access-token");

    userRepo = createMockUserRepo();
    sessionRepo = createMockSessionRepo({
      findSessionByTokenHash: vi.fn().mockResolvedValue(fakeSession),
      updateSession: vi.fn().mockResolvedValue(null),
    });

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
    );
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw InvalidRefreshTokenError when session is not found", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue(null);

    await expect(authService.rotateToken(oldRefreshToken)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("should hash the incoming token to look up the session", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue(null);

    await authService.rotateToken(oldRefreshToken).catch(() => {});

    expect(hashRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(sessionRepo.findSessionByTokenHash).toHaveBeenCalledWith(
      `hashed-${oldRefreshToken}`,
    );
  });

  it("should throw ExpiredSessionError when session is expired", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue({
      ...fakeSession,
      expiresAt: pastDate,
    });

    await expect(authService.rotateToken(oldRefreshToken)).rejects.toThrow(
      ExpiredSessionError,
    );
  });

  it("should throw RevokedSessionError when session is revoked", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue({
      ...fakeSession,
      revokedAt: new Date("2026-08-29T00:00:00Z"),
    });

    await expect(authService.rotateToken(oldRefreshToken)).rejects.toThrow(
      RevokedSessionError,
    );
  });

  it("should throw InvalidCredentialsError when user is soft-deleted", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue({
      ...fakeSession,
      user: {
        ...fakeSession.user,
        deletedAt: new Date("2026-08-29T00:00:00Z").toISOString(),
      },
    });

    await expect(authService.rotateToken(oldRefreshToken)).rejects.toThrow(
      InvalidCredentialsError,
    );
    await expect(authService.rotateToken(oldRefreshToken)).rejects.toThrow(
      "Invalid refresh token",
    );
  });

  it("should not update session or generate tokens on any error", async () => {
    vi.mocked(sessionRepo.findSessionByTokenHash).mockResolvedValue(null);

    await authService.rotateToken(oldRefreshToken).catch(() => {});

    expect(sessionRepo.updateSession).not.toHaveBeenCalled();
    expect(generateRefreshToken).not.toHaveBeenCalled();
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should generate a new refresh token", async () => {
    await authService.rotateToken(oldRefreshToken);

    expect(generateRefreshToken).toHaveBeenCalled();
  });

  it("should update the session with the new token hash and expiry", async () => {
    await authService.rotateToken(oldRefreshToken);

    // hashRefreshToken is called twice: once for lookup, once for the new token
    expect(sessionRepo.updateSession).toHaveBeenCalledWith(fakeSession.id, {
      tokenHash: "hashed-new-refresh-token",
      expiresAt: expect.any(String),
    });
  });

  it("should generate a new access token with session and user IDs", async () => {
    await authService.rotateToken(oldRefreshToken);

    expect(signAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeSession.user.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return newRefreshToken and newAccessToken on success", async () => {
    const result = await authService.rotateToken(oldRefreshToken);

    expect(result).toEqual({
      newRefreshToken: "new-refresh-token",
      newAccessToken: "new-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(hashRefreshToken).mockImplementation((token: string) => {
      callOrder.push("hashRefreshToken");
      return `hashed-${token}`;
    });
    vi.mocked(sessionRepo.findSessionByTokenHash).mockImplementation(
      async () => {
        callOrder.push("findSessionByTokenHash");
        return fakeSession;
      },
    );
    vi.mocked(generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return "new-refresh-token";
    });
    vi.mocked(sessionRepo.updateSession).mockImplementation(async () => {
      callOrder.push("updateSession");
      return null;
    });
    vi.mocked(signAccessToken).mockImplementation(async () => {
      callOrder.push("signAccessToken");
      return "new-access-token";
    });

    await authService.rotateToken(oldRefreshToken);

    expect(callOrder).toEqual([
      "hashRefreshToken",
      "findSessionByTokenHash",
      "generateRefreshToken",
      "hashRefreshToken",
      "updateSession",
      "signAccessToken",
    ]);
  });
});
