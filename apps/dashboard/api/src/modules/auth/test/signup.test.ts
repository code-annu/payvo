import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../auth.service.js";
import type SessionRepository from "../repository/session.repository.js";
import type UserRepository from "../../user/repository/user.repository.js";
import type { SignupDto } from "../dto/SignupDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import { EmailAlreadyExistsError } from "../error/auth.errors.js";
import { hashPassword } from "@payvo/shared/crypto";
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

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(generateRefreshToken).mockReturnValue("mock-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("mock-token-hash");
    vi.mocked(signAccessToken).mockResolvedValue("mock-access-token");

    userRepo = createMockUserRepo({
      createUser: vi.fn().mockResolvedValue(fakeUser),
    });
    sessionRepo = createMockSessionRepo({
      createSession: vi.fn().mockResolvedValue(fakeSession),
    });

    authService = new AuthService(
      sessionRepo as SessionRepository,
      userRepo as UserRepository,
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

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userRepo.createUser).not.toHaveBeenCalled();
  });

  it("should hash the password before creating the user", async () => {
    await authService.signup(signupInput);

    expect(hashPassword).toHaveBeenCalledWith(signupInput.password);
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

  it("should generate a refresh token", async () => {
    await authService.signup(signupInput);

    expect(generateRefreshToken).toHaveBeenCalled();
  });

  it("should hash the refresh token and create a session with the correct data", async () => {
    await authService.signup(signupInput);

    expect(hashRefreshToken).toHaveBeenCalledWith("mock-refresh-token");
    expect(sessionRepo.createSession).toHaveBeenCalledWith({
      userId: fakeUser.id,
      tokenHash: "mock-token-hash",
      userAgent: signupInput.userAgent,
      ipAddress: signupInput.ipAddress,
      expiresAt: expect.any(String),
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

    expect(signAccessToken).toHaveBeenCalledWith(
      { sid: fakeSession.id, sub: fakeUser.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("should return user, session, refreshToken, and accessToken on success", async () => {
    const result = await authService.signup(signupInput);

    expect(result).toEqual({
      user: fakeUser,
      session: fakeSession,
      refreshToken: "mock-refresh-token",
      accessToken: "mock-access-token",
    });
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findUserByEmail).mockImplementation(async () => {
      callOrder.push("findUserByEmail");
      return null;
    });
    vi.mocked(hashPassword).mockImplementation(async () => {
      callOrder.push("hashPassword");
      return "hashed-password";
    });
    vi.mocked(userRepo.createUser).mockImplementation(async () => {
      callOrder.push("createUser");
      return fakeUser;
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

    await authService.signup(signupInput);

    expect(callOrder).toEqual([
      "findUserByEmail",
      "hashPassword",
      "createUser",
      "generateRefreshToken",
      "hashRefreshToken",
      "createSession",
      "signAccessToken",
    ]);
  });
});
