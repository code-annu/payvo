import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { JWTService } from "@payvo/shared/jwt";
import type { PasswordHashService } from "@payvo/shared/password-hash";
import type { LoginDto } from "../dto/LoginDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import { InvalidCredentialsError } from "../error/auth.errors.js";

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

function createMockJwtService(overrides: Partial<JWTService> = {}): JWTService {
  return {
    generateAccessToken: vi.fn().mockReturnValue("mock-access-token"),
    generateRefreshToken: vi.fn().mockReturnValue({
      token: "mock-refresh-token",
      expiresAt: new Date("2026-09-06T00:00:00Z"),
    }),
    verifyAccessToken: vi.fn(),
    hashToken: vi.fn().mockReturnValue("double-hashed-refresh-token"),
    ...overrides,
  } as unknown as JWTService;
}

function createMockPasswordHashService(
  overrides: Partial<PasswordHashService> = {},
): PasswordHashService {
  return {
    hashPassword: vi.fn().mockResolvedValue("hashed-password"),
    comparePassword: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as PasswordHashService;
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
  let jwtService: ReturnType<typeof createMockJwtService>;
  let passwordHashService: ReturnType<typeof createMockPasswordHashService>;

  beforeEach(() => {
    userRepo = createMockUserRepo({
      findUserByEmail: vi.fn().mockResolvedValue(fakeUser),
    });
    sessionRepo = createMockSessionRepo({
      createSession: vi.fn().mockResolvedValue(fakeSession),
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
    vi.mocked(passwordHashService.comparePassword).mockResolvedValue(false);

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
    expect(jwtService.generateRefreshToken).not.toHaveBeenCalled();
    expect(jwtService.generateAccessToken).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should compare password with stored hash", async () => {
    await authService.login(loginInput);

    expect(passwordHashService.comparePassword).toHaveBeenCalledWith(
      loginInput.password,
      fakeUser.passwordHash,
    );
  });

  it("should generate a refresh token with configured expiry", async () => {
    await authService.login(loginInput);

    expect(jwtService.generateRefreshToken).toHaveBeenCalledWith({
      expiresInDays: 7,
    });
  });

  it("should create a session with the correct data", async () => {
    await authService.login(loginInput);

    expect(sessionRepo.createSession).toHaveBeenCalledWith({
      userId: fakeUser.id,
      tokenHash: "double-hashed-refresh-token",
      userAgent: loginInput.userAgent,
      ipAddress: loginInput.ipAddress,
      expiresAt: "2026-09-06T00:00:00.000Z",
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

    expect(jwtService.generateAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeUser.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return user, refreshToken, and accessToken on success", async () => {
    const result = await authService.login(loginInput);

    expect(result).toEqual({
      user: fakeUser,
      refreshToken: {
        token: "mock-refresh-token",
        expiresAt: new Date("2026-09-06T00:00:00Z"),
      },
      accessToken: "mock-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findUserByEmail).mockImplementation(async () => {
      callOrder.push("findUserByEmail");
      return fakeUser;
    });
    vi.mocked(passwordHashService.comparePassword).mockImplementation(
      async () => {
        callOrder.push("comparePassword");
        return true;
      },
    );
    vi.mocked(jwtService.generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return {
        token: "mock-refresh-token",
        expiresAt: new Date("2026-09-06T00:00:00Z"),
      };
    });
    vi.mocked(sessionRepo.createSession).mockImplementation(async () => {
      callOrder.push("createSession");
      return fakeSession;
    });
    vi.mocked(jwtService.generateAccessToken).mockImplementation(() => {
      callOrder.push("generateAccessToken");
      return "mock-access-token";
    });

    await authService.login(loginInput);

    expect(callOrder).toEqual([
      "findUserByEmail",
      "comparePassword",
      "generateRefreshToken",
      "createSession",
      "generateAccessToken",
    ]);
  });
});
