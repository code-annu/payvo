import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { JWTService } from "@payvo/shared/jwt";
import type { PasswordHashService } from "@payvo/shared/password-hash";
import type { SignupDto } from "../dto/SignupDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import { EmailAlreadyExistsError } from "../error/auth.errors.js";

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

function createMockJwtService(
  overrides: Partial<JWTService> = {},
): JWTService {
  return {
    generateAccessToken: vi.fn().mockReturnValue("mock-access-token"),
    generateRefreshToken: vi.fn().mockReturnValue({
      token: "hashed-refresh-token",
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
    comparePassword: vi.fn(),
    ...overrides,
  } as unknown as PasswordHashService;
}

// ── Fixtures ───────────────────────────────────────────────────────
const now = new Date("2026-08-30T12:00:00Z");

const signupInput: SignupDto = {
  email: "john@example.com",
  password: "StrongP@ss1",
  fullname: "John Doe",
  companyName: "Acme Inc",
  userAgent: "Mozilla/5.0",
  ipAddress: "192.168.1.1",
};

const fakeUser: User = {
  id: "user-1",
  email: signupInput.email,
  passwordHash: "hashed-password",
  fullname: signupInput.fullname,
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
  userAgent: signupInput.userAgent!,
  ipAddress: signupInput.ipAddress!,
  revokedAt: null,
  expiresAt: new Date("2026-09-06T00:00:00Z"),
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("AuthService.signup", () => {
  let authService: AuthService;
  let userRepo: ReturnType<typeof createMockUserRepo>;
  let sessionRepo: ReturnType<typeof createMockSessionRepo>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let passwordHashService: ReturnType<typeof createMockPasswordHashService>;

  beforeEach(() => {
    userRepo = createMockUserRepo({
      createUser: vi.fn().mockResolvedValue(fakeUser),
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

  it("should throw EmailAlreadyExistsError when email is taken", async () => {
    vi.mocked(userRepo.findUserByEmail).mockResolvedValue(fakeUser);

    await expect(authService.signup(signupInput)).rejects.toThrow(
      EmailAlreadyExistsError,
    );
    await expect(authService.signup(signupInput)).rejects.toThrow(
      `User with email ${signupInput.email} already exists`,
    );
  });

  it("should not hash password or create user when email exists", async () => {
    vi.mocked(userRepo.findUserByEmail).mockResolvedValue(fakeUser);

    await authService.signup(signupInput).catch(() => {});

    expect(passwordHashService.hashPassword).not.toHaveBeenCalled();
    expect(userRepo.createUser).not.toHaveBeenCalled();
  });

  it("should hash the password before creating the user", async () => {
    await authService.signup(signupInput);

    expect(passwordHashService.hashPassword).toHaveBeenCalledWith(
      signupInput.password,
    );
  });

  it("should create a user with correct data", async () => {
    await authService.signup(signupInput);

    expect(userRepo.createUser).toHaveBeenCalledWith({
      email: signupInput.email,
      passwordHash: "hashed-password",
      fullname: signupInput.fullname,
      companyName: signupInput.companyName,
    });
  });

  it("should pass null for companyName when not provided", async () => {
    const inputWithoutCompany: SignupDto = {
      ...signupInput,
      companyName: undefined,
    };

    await authService.signup(inputWithoutCompany);

    expect(userRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: null }),
    );
  });

  it("should generate a refresh token with configured expiry", async () => {
    await authService.signup(signupInput);

    expect(jwtService.generateRefreshToken).toHaveBeenCalledWith({
      expiresInDays: 7,
    });
  });

  it("should create a session with the correct data", async () => {
    await authService.signup(signupInput);

    expect(sessionRepo.createSession).toHaveBeenCalledWith({
      userId: fakeUser.id,
      tokenHash: "double-hashed-refresh-token",
      userAgent: signupInput.userAgent,
      ipAddress: signupInput.ipAddress,
      expiresAt: "2026-09-06T00:00:00.000Z",
    });
  });

  it("should pass null for userAgent and ipAddress when not provided", async () => {
    const inputWithoutMeta: SignupDto = {
      ...signupInput,
      userAgent: undefined,
      ipAddress: undefined,
    };

    await authService.signup(inputWithoutMeta);

    expect(sessionRepo.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: null,
        ipAddress: null,
      }),
    );
  });

  it("should generate an access token with session and user IDs", async () => {
    await authService.signup(signupInput);

    expect(jwtService.generateAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeUser.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return user, session, refreshToken, and accessToken on success", async () => {
    const result = await authService.signup(signupInput);

    expect(result).toEqual({
      user: fakeUser,
      session: fakeSession,
      refreshToken: {
        token: "hashed-refresh-token",
        expiresAt: new Date("2026-09-06T00:00:00Z"),
      },
      accessToken: "mock-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findUserByEmail).mockImplementation(async () => {
      callOrder.push("findUserByEmail");
      return null;
    });
    vi.mocked(passwordHashService.hashPassword).mockImplementation(
      async () => {
        callOrder.push("hashPassword");
        return "hashed-password";
      },
    );
    vi.mocked(userRepo.createUser).mockImplementation(async () => {
      callOrder.push("createUser");
      return fakeUser;
    });
    vi.mocked(jwtService.generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return {
        token: "hashed-refresh-token",
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

    await authService.signup(signupInput);

    expect(callOrder).toEqual([
      "findUserByEmail",
      "hashPassword",
      "createUser",
      "generateRefreshToken",
      "createSession",
      "generateAccessToken",
    ]);
  });
});
