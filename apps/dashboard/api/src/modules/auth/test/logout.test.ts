import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";

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

// ── Tests ──────────────────────────────────────────────────────────
describe("AuthService.logout", () => {
  let authService: AuthService;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;

  beforeEach(() => {
    const userRepo = createMockUserRepo();
    sessionRepo = createMockSessionRepo({
      revokeSession: vi.fn().mockResolvedValue(undefined),
    });

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
    );
  });

  it("should call sessionRepo.revokeSession with the correct session ID", async () => {
    const sessionId = "session-123";

    await authService.logout(sessionId);

    expect(sessionRepo.revokeSession).toHaveBeenCalledWith(sessionId);
    expect(sessionRepo.revokeSession).toHaveBeenCalledTimes(1);
  });

  it("should resolve without returning a value", async () => {
    const result = await authService.logout("session-123");

    expect(result).toBeUndefined();
  });

  it("should propagate errors from the repository", async () => {
    const dbError = new Error("Database connection lost");
    vi.mocked(sessionRepo.revokeSession).mockRejectedValue(dbError);

    await expect(authService.logout("session-123")).rejects.toThrow(
      "Database connection lost",
    );
  });
});
