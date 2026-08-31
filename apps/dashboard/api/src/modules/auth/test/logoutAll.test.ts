import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { JWTService } from "@payvo/shared/jwt";
import type { PasswordHashService } from "@payvo/shared/password-hash";

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
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    hashToken: vi.fn(),
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

// ── Tests ──────────────────────────────────────────────────────────
describe("AuthService.logoutAll", () => {
  let authService: AuthService;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;

  beforeEach(() => {
    const userRepo = createMockUserRepo();
    sessionRepo = createMockSessionRepo({
      revokeSessionByUserId: vi.fn().mockResolvedValue(undefined),
    });
    const jwtService = createMockJwtService();
    const passwordHashService = createMockPasswordHashService();

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
      jwtService as JWTService,
      passwordHashService as PasswordHashService,
    );
  });

  it("should call sessionRepo.revokeSessionByUserId with the correct user ID", async () => {
    const userId = "user-123";

    await authService.logoutAll(userId);

    expect(sessionRepo.revokeSessionByUserId).toHaveBeenCalledWith(userId);
    expect(sessionRepo.revokeSessionByUserId).toHaveBeenCalledTimes(1);
  });

  it("should resolve without returning a value", async () => {
    const result = await authService.logoutAll("user-123");

    expect(result).toBeUndefined();
  });

  it("should propagate errors from the repository", async () => {
    const dbError = new Error("Database connection lost");
    vi.mocked(sessionRepo.revokeSessionByUserId).mockRejectedValue(dbError);

    await expect(authService.logoutAll("user-123")).rejects.toThrow(
      "Database connection lost",
    );
  });
});
