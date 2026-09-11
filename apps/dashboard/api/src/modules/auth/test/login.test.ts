import "reflect-metadata";
import type UserRepository from "../../user/repository/user.repository.js";
import type SessionRepository from "../repository/session.repository.js";
import type RefreshTokenRepository from "../repository/refresh-token.repository.js";
import { InvalidCredentialsError, InactiveUserError } from "../error/auth.errors.js";
import type { LoginDto } from "../dto/LoginDto.js";
import type { User } from "../../user/entity/user.entity.js";
import type { Session } from "../entity/session.entity.js";
import type { RefreshToken } from "../entity/refresh-token.entity.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
}));

vi.mock("@payvo/database/types", () => ({}));

// ---------------------------------------------------------------------------
// Mock external shared packages
// ---------------------------------------------------------------------------

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

// Re-import mocked modules for assertions
import { verifyPassword } from "@payvo/shared/crypto";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import AuthService from "../auth.service.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers – create mock repository instances
// ---------------------------------------------------------------------------

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
    revoke: vi.fn(),
  } as unknown as SessionRepository;
}

function createMockRefreshTokenRepo(): RefreshTokenRepository {
  return {
    create: vi.fn(),
  } as unknown as RefreshTokenRepository;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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

    // Manually construct AuthService, bypassing inversify DI
    authService = new (AuthService as any)(
      userRepo,
      sessionRepo,
      refreshTokenRepo,
    );
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should return accessToken, refreshToken, and session on successful login", async () => {
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

  // -----------------------------------------------------------------------
  // User lookup
  // -----------------------------------------------------------------------

  it("should look up the user by email", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(userRepo.findByEmail).toHaveBeenCalledOnce();
    expect(userRepo.findByEmail).toHaveBeenCalledWith(loginInput.email);
  });

  // -----------------------------------------------------------------------
  // InvalidCredentialsError – user not found
  // -----------------------------------------------------------------------

  it("should throw InvalidCredentialsError when no user is found for the email", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(authService.login(loginInput)).rejects.toThrow(
      InvalidCredentialsError,
    );
    await expect(authService.login(loginInput)).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("should NOT create session or tokens when user is not found", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(authService.login(loginInput)).rejects.toThrow();

    expect(sessionRepo.create).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // InvalidCredentialsError – wrong password
  // -----------------------------------------------------------------------

  it("should throw InvalidCredentialsError when password verification fails", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(authService.login(loginInput)).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it("should verify password with the correct arguments (plaintext, hash)", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(verifyPassword).toHaveBeenCalledOnce();
    expect(verifyPassword).toHaveBeenCalledWith(
      loginInput.password,
      fakeUser.passwordHash,
    );
  });

  it("should NOT create session or tokens when password is wrong", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(authService.login(loginInput)).rejects.toThrow();

    expect(sessionRepo.create).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // InvalidCredentialsError – soft-deleted user
  // -----------------------------------------------------------------------

  it("should throw InactiveUserError when the user has been soft-deleted", async () => {
    const deletedUser: User = {
      ...fakeUser,
      deletedAt: new Date("2026-08-01T00:00:00.000Z"),
    };

    vi.mocked(userRepo.findByEmail).mockResolvedValue(deletedUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await expect(authService.login(loginInput)).rejects.toThrow(
      InactiveUserError,
    );
  });

  it("should NOT create session or tokens for soft-deleted users", async () => {
    const deletedUser: User = {
      ...fakeUser,
      deletedAt: new Date("2026-08-01T00:00:00.000Z"),
    };

    vi.mocked(userRepo.findByEmail).mockResolvedValue(deletedUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await expect(authService.login(loginInput)).rejects.toThrow();

    expect(sessionRepo.create).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Session creation
  // -----------------------------------------------------------------------

  it("should create a session with the correct userId and client info", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(sessionRepo.create).toHaveBeenCalledOnce();
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser.id,
        userAgent: loginInput.client.userAgent,
        ipAddress: loginInput.client.ipAddress,
      }),
    );
  });

  it("should set session expiresAt based on sessionConfig.sessionExpiryDays", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    const createCall = vi.mocked(sessionRepo.create).mock.calls[0]![0];
    const expiresAt = new Date(createCall.expiresAt);
    const nowDate = new Date();
    const diffDays =
      (expiresAt.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7.01);
  });

  // -----------------------------------------------------------------------
  // Refresh token creation
  // -----------------------------------------------------------------------

  it("should generate a refresh token and persist its hash", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(generateRefreshToken).toHaveBeenCalledOnce();
    expect(hashRefreshToken).toHaveBeenCalledOnce();
    expect(hashRefreshToken).toHaveBeenCalledWith("raw-refresh-token-stub");

    expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      sessionId: fakeSession.id,
      tokenHash: "hashed-refresh-token-stub",
    });
  });

  // -----------------------------------------------------------------------
  // Access token signing
  // -----------------------------------------------------------------------

  it("should sign an access token with the correct payload and config", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.login(loginInput);

    expect(signAccessToken).toHaveBeenCalledOnce();
    expect(signAccessToken).toHaveBeenCalledWith(
      { sub: fakeUser.id, sid: fakeSession.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  // -----------------------------------------------------------------------
  // Return value structure
  // -----------------------------------------------------------------------

  it("should return the raw (unhashed) refresh token string", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.login(loginInput);

    expect(result.refreshToken).toBe("raw-refresh-token-stub");
    expect(result.refreshToken).not.toBe("hashed-refresh-token-stub");
  });

  it("should return the session object from the repository", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.login(loginInput);

    expect(result.session).toStrictEqual(fakeSession);
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by userRepo.findByEmail", async () => {
    vi.mocked(userRepo.findByEmail).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(authService.login(loginInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by sessionRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockRejectedValue(
      new Error("Session insert failed"),
    );

    await expect(authService.login(loginInput)).rejects.toThrow(
      "Session insert failed",
    );
  });

  it("should propagate errors thrown by refreshTokenRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockRejectedValue(
      new Error("Refresh token insert failed"),
    );

    await expect(authService.login(loginInput)).rejects.toThrow(
      "Refresh token insert failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findByEmail → verifyPassword → create session → create refreshToken → signAccessToken", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findByEmail).mockImplementation(async () => {
      callOrder.push("findByEmail");
      return fakeUser;
    });
    vi.mocked(verifyPassword).mockImplementation(async () => {
      callOrder.push("verifyPassword");
      return true;
    });
    vi.mocked(sessionRepo.create).mockImplementation(async () => {
      callOrder.push("createSession");
      return fakeSession;
    });
    vi.mocked(refreshTokenRepo.create).mockImplementation(async () => {
      callOrder.push("createRefreshToken");
      return fakeRefreshToken;
    });
    vi.mocked(signAccessToken).mockImplementation(async () => {
      callOrder.push("signAccessToken");
      return "access-token-stub";
    });

    await authService.login(loginInput);

    expect(callOrder).toEqual([
      "findByEmail",
      "verifyPassword",
      "createSession",
      "createRefreshToken",
      "signAccessToken",
    ]);
  });

  // -----------------------------------------------------------------------
  // Edge case: null client fields
  // -----------------------------------------------------------------------

  it("should handle login when client userAgent and ipAddress are null", async () => {
    const inputNullClient: LoginDto = {
      ...loginInput,
      client: { userAgent: null, ipAddress: null },
    };

    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(sessionRepo.create).mockResolvedValue({
      ...fakeSession,
      userAgent: null,
      ipAddress: null,
    });
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.login(inputNullClient);

    expect(result.accessToken).toBe("access-token-stub");
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: null,
        ipAddress: null,
      }),
    );
  });
});
