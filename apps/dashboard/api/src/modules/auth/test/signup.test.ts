import "reflect-metadata";
import type UserRepository from "../../user/repository/user.repository";
import type SessionRepository from "../repository/session.repository";
import type RefreshTokenRepository from "../repository/refresh-token.repository";
import { EmailAlreadyExists } from "../error/auth.errors";
import type { SignupDto } from "../dto/SignupDto";
import type { User } from "../../user/entity/user.entity";
import type { Session } from "../entity/session.entity";
import type { RefreshToken } from "../entity/refresh-token.entity";

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
  hashPassword: vi.fn().mockResolvedValue("hashed-password-stub"),
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

// Re-import mocked modules so we can assert against them
import { hashPassword } from "@payvo/shared/crypto";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import AuthService from "../auth.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeUser: User = {
  id: "user-1",
  email: "john@example.com",
  passwordHash: "hashed-password-stub",
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

const signupInput: SignupDto = {
  email: "john@example.com",
  password: "Str0ng!Pass",
  fullname: "John Doe",
  companyName: "Acme Inc",
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

describe("AuthService.signup", () => {
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

  it("should create a user, session, refresh token, and return tokens on successful signup", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.signup(signupInput);

    // Returns the expected shape
    expect(result).toEqual({
      accessToken: "access-token-stub",
      refreshToken: "raw-refresh-token-stub",
      session: fakeSession,
    });
  });

  // -----------------------------------------------------------------------
  // Email uniqueness check
  // -----------------------------------------------------------------------

  it("should check if the email already exists before creating a user", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

    expect(userRepo.findByEmail).toHaveBeenCalledOnce();
    expect(userRepo.findByEmail).toHaveBeenCalledWith(signupInput.email);
  });

  it("should throw EmailAlreadyExists when the email is already registered", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);

    await expect(authService.signup(signupInput)).rejects.toThrow(
      EmailAlreadyExists,
    );
    await expect(authService.signup(signupInput)).rejects.toThrow(
      "This email is associated with another account",
    );
  });

  it("should NOT create a user, session, or refresh token when email already exists", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(fakeUser);

    await expect(authService.signup(signupInput)).rejects.toThrow();

    expect(userRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.create).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Password hashing
  // -----------------------------------------------------------------------

  it("should hash the password before persisting the user", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

    expect(hashPassword).toHaveBeenCalledOnce();
    expect(hashPassword).toHaveBeenCalledWith(signupInput.password);
  });

  it("should pass the hashed password (not plaintext) to userRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: signupInput.email,
        passwordHash: "hashed-password-stub",
        fullname: signupInput.fullname,
        companyName: signupInput.companyName,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Session creation
  // -----------------------------------------------------------------------

  it("should create a session with the correct userId and client info", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

    expect(sessionRepo.create).toHaveBeenCalledOnce();
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: fakeUser.id,
        userAgent: signupInput.client.userAgent,
        ipAddress: signupInput.client.ipAddress,
      }),
    );
  });

  it("should set session expiresAt based on sessionConfig.sessionExpiryDays", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

    const createCall = vi.mocked(sessionRepo.create).mock.calls[0]![0];
    // expiresAt should be an ISO string approximately 7 days from now
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
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

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
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    await authService.signup(signupInput);

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
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.signup(signupInput);

    // Should return the raw token, NOT the hash
    expect(result.refreshToken).toBe("raw-refresh-token-stub");
    expect(result.refreshToken).not.toBe("hashed-refresh-token-stub");
  });

  it("should return the session object from the repository", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.signup(signupInput);

    expect(result.session).toStrictEqual(fakeSession);
  });

  // -----------------------------------------------------------------------
  // Signup with optional companyName as null
  // -----------------------------------------------------------------------

  it("should handle signup when companyName is null", async () => {
    const inputWithoutCompany: SignupDto = {
      ...signupInput,
      companyName: null,
    };

    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue({
      ...fakeUser,
      companyName: null,
    });
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeRefreshToken);

    const result = await authService.signup(inputWithoutCompany);

    expect(result.accessToken).toBe("access-token-stub");
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: null }),
    );
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by userRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(authService.signup(signupInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by sessionRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockRejectedValue(
      new Error("Session insert failed"),
    );

    await expect(authService.signup(signupInput)).rejects.toThrow(
      "Session insert failed",
    );
  });

  it("should propagate errors thrown by refreshTokenRepo.create", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepo.create).mockResolvedValue(fakeUser);
    vi.mocked(sessionRepo.create).mockResolvedValue(fakeSession);
    vi.mocked(refreshTokenRepo.create).mockRejectedValue(
      new Error("Refresh token insert failed"),
    );

    await expect(authService.signup(signupInput)).rejects.toThrow(
      "Refresh token insert failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findByEmail → hashPassword → create user → create session → create refreshToken → signAccessToken", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findByEmail).mockImplementation(async () => {
      callOrder.push("findByEmail");
      return null;
    });
    vi.mocked(hashPassword).mockImplementation(async () => {
      callOrder.push("hashPassword");
      return "hashed-password-stub";
    });
    vi.mocked(userRepo.create).mockImplementation(async () => {
      callOrder.push("createUser");
      return fakeUser;
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

    await authService.signup(signupInput);

    expect(callOrder).toEqual([
      "findByEmail",
      "hashPassword",
      "createUser",
      "createSession",
      "createRefreshToken",
      "signAccessToken",
    ]);
  });
});
