import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { JWTService } from "@payvo/shared/jwt";
import type { PasswordHashService } from "@payvo/shared/password-hash";
import type { Session } from "../entity/session.entity.js";
import {
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedSessionError,
} from "../error/auth.errors.js";

// ── Mock @payvo/config so tests don't depend on real env vars ──────
vi.mock("@payvo/config", () => ({
  jwtConfig: {
    ACCESS_TOKEN: { SECRET: "test-secret", EXPIRY_MINUTE: 15 },
    REFRESH_TOKEN: { EXPIRY_DAYS: 7 },
  },
  databaseConfig: {
    DATABASE_URL: "postgresql://mock:mock@localhost:5432/test",
  },
  serverConfig: {
    DASHBOARD_API: { PORT: 3000 },
  },
}));

// ── Mock @payvo/database to prevent Prisma from connecting ─────────
vi.mock("@payvo/database", () => ({
  db: {},
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

function createMockJwtService(
  overrides: Partial<JWTService> = {},
): JWTService {
  return {
    generateAccessToken: vi.fn().mockReturnValue("new-access-token"),
    generateRefreshToken: vi.fn().mockReturnValue({
      token: "new-refresh-token",
      expiresAt: new Date("2026-09-06T00:00:00Z"),
    }),
    verifyAccessToken: vi.fn(),
    hashToken: vi.fn().mockReturnValue("hashed-token"),
    ...overrides,
  } as unknown as JWTService;
}

function createMockPasswordHashService(
  overrides: Partial<PasswordHashService> = {},
): PasswordHashService {
  return {
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    ...overrides,
  } as unknown as PasswordHashService;
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
  let jwtService: ReturnType<typeof createMockJwtService>;
  let passwordHashService: ReturnType<typeof createMockPasswordHashService>;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    sessionRepo = createMockSessionRepo({
      findSessionByTokenHash: vi.fn().mockResolvedValue(fakeSession),
      updateSession: vi.fn().mockResolvedValue(null),
    });
    jwtService = createMockJwtService();
    passwordHashService = createMockPasswordHashService();

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
      jwtService as JWTService,
      passwordHashService as PasswordHashService,
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

    expect(jwtService.hashToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(sessionRepo.findSessionByTokenHash).toHaveBeenCalledWith(
      "hashed-token",
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
        deletedAt: "2026-08-29T00:00:00Z",
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
    expect(jwtService.generateRefreshToken).not.toHaveBeenCalled();
    expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should generate a new refresh token with configured expiry", async () => {
    await authService.rotateToken(oldRefreshToken);

    expect(jwtService.generateRefreshToken).toHaveBeenCalledWith({
      expiresInDays: 7,
    });
  });

  it("should update the session with the new token hash and expiry", async () => {
    await authService.rotateToken(oldRefreshToken);

    // hashToken is called twice: once for lookup, once for the new token
    expect(sessionRepo.updateSession).toHaveBeenCalledWith(fakeSession.id, {
      tokenHash: "hashed-token",
      expiresAt: "2026-09-06T00:00:00.000Z",
    });
  });

  it("should generate a new access token with session and user IDs", async () => {
    await authService.rotateToken(oldRefreshToken);

    expect(jwtService.generateAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeSession.user.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return newRefreshToken and newAccessToken on success", async () => {
    const result = await authService.rotateToken(oldRefreshToken);

    expect(result).toEqual({
      newRefreshToken: {
        token: "new-refresh-token",
        expiresAt: new Date("2026-09-06T00:00:00Z"),
      },
      newAccessToken: "new-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(jwtService.hashToken).mockImplementation((token: string) => {
      callOrder.push("hashToken");
      return "hashed-token";
    });
    vi.mocked(sessionRepo.findSessionByTokenHash).mockImplementation(
      async () => {
        callOrder.push("findSessionByTokenHash");
        return fakeSession;
      },
    );
    vi.mocked(jwtService.generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return {
        token: "new-refresh-token",
        expiresAt: new Date("2026-09-06T00:00:00Z"),
      };
    });
    vi.mocked(sessionRepo.updateSession).mockImplementation(async () => {
      callOrder.push("updateSession");
      return null;
    });
    vi.mocked(jwtService.generateAccessToken).mockImplementation(() => {
      callOrder.push("generateAccessToken");
      return "new-access-token";
    });

    await authService.rotateToken(oldRefreshToken);

    expect(callOrder).toEqual([
      "hashToken",
      "findSessionByTokenHash",
      "generateRefreshToken",
      "hashToken",
      "updateSession",
      "generateAccessToken",
    ]);
  });
});
