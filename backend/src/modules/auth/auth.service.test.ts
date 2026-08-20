import AuthService from "./auth.service";
import {
  EmailAlreadyExistsError,
  ExpiredRefreshTokenError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  SessionExpiredError,
  SessionRevokedError,
} from "./auth.errors";
import bcrypt from "bcrypt";

// ── Mock ENV before anything imports it ──────────────────────────────
vi.mock("@/core/config/env", () => ({
  default: {
    JWT_ACCESS_SECRET: "test-secret",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: 7,
    SESSION_EXPIRY_DAYS: 30,
  },
}));

// ── Mock bcrypt ──────────────────────────────────────────────────────
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-20T12:00:00Z");
const future = new Date("2026-09-20T12:00:00Z");
const past = new Date("2026-07-20T12:00:00Z");

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  passwordHash: "hashed-password",
  fullname: "Test User",
  companyName: null,
  isEmailVerified: false,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const mockSession = {
  id: "session-1",
  user: mockUser,
  userAgent: "test-agent",
  ipAddress: "127.0.0.1",
  revokedAt: null,
  expiresAt: future,
  createdAt: now,
  updatedAt: now,
};

const mockRefreshToken = {
  id: "rt-1",
  tokenHash: "hashed-token",
  session: mockSession,
  expiresAt: future,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
};

const mockClient = { ipAddress: "127.0.0.1", userAgent: "test-agent" };

// ── Stub repositories & JWT util ─────────────────────────────────────
function createMocks() {
  return {
    userRepo: {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sessionRepo: {
      create: vi.fn(),
      findById: vi.fn(),
      revoke: vi.fn(),
      revokeAllByUserId: vi.fn(),
    },
    refreshTokenRepo: {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      revoke: vi.fn(),
      revokeBySessionId: vi.fn(),
      revokeByUserId: vi.fn(),
    },
    jwtUtil: {
      generateAccessToken: vi.fn().mockReturnValue("access-token"),
      generateRefreshToken: vi.fn().mockReturnValue("refresh-token-str"),
      hashToken: vi.fn().mockReturnValue("hashed-token"),
      verifyAccessToken: vi.fn(),
      generateRefreshTokenExpiry: vi.fn().mockReturnValue(future),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new AuthService(
    mocks.userRepo as any,
    mocks.sessionRepo as any,
    mocks.refreshTokenRepo as any,
    mocks.jwtUtil as any,
  );
}

// =====================================================================
// signup
// =====================================================================
describe("AuthService.signup", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should create user, session, refresh token and return tokens", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue("hashed-password");
    mocks.userRepo.create.mockResolvedValue(mockUser);
    mocks.sessionRepo.create.mockResolvedValue(mockSession);
    mocks.refreshTokenRepo.create.mockResolvedValue(mockRefreshToken);

    const result = await service.signup({
      email: "test@example.com",
      password: "Password1!",
      fullname: "Test User",
      client: mockClient,
    });

    expect(mocks.userRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
    expect(mocks.userRepo.create).toHaveBeenCalledWith({
      email: "test@example.com",
      passwordHash: "hashed-password",
      fullname: "Test User",
      companyName: null,
    });
    expect(mocks.sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
    expect(mocks.refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: "hashed-token",
        sessionId: "session-1",
      }),
    );
    expect(result.user).toEqual(mockUser);
    expect(result.session.accessToken).toBe("access-token");
    expect(result.session.refreshToken).toBe("refresh-token-str");
  });

  it("should throw EmailAlreadyExistsError if email is taken", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.signup({
        email: "test@example.com",
        password: "Password1!",
        fullname: "Test User",
        client: mockClient,
      }),
    ).rejects.toThrow(EmailAlreadyExistsError);

    expect(mocks.userRepo.create).not.toHaveBeenCalled();
  });

  it("should pass companyName when provided", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue("hashed-password");
    mocks.userRepo.create.mockResolvedValue({
      ...mockUser,
      companyName: "Acme Inc",
    });
    mocks.sessionRepo.create.mockResolvedValue(mockSession);
    mocks.refreshTokenRepo.create.mockResolvedValue(mockRefreshToken);

    await service.signup({
      email: "test@example.com",
      password: "Password1!",
      fullname: "Test User",
      companyName: "Acme Inc",
      client: mockClient,
    });

    expect(mocks.userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: "Acme Inc" }),
    );
  });
});

// =====================================================================
// login
// =====================================================================
describe("AuthService.login", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return user and tokens on valid credentials", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(true);
    mocks.sessionRepo.create.mockResolvedValue(mockSession);
    mocks.refreshTokenRepo.create.mockResolvedValue(mockRefreshToken);

    const result = await service.login({
      email: "test@example.com",
      password: "Password1!",
      client: mockClient,
    });

    expect(result.user).toEqual(mockUser);
    expect(result.session.accessToken).toBe("access-token");
    expect(result.session.refreshToken).toBe("refresh-token-str");
  });

  it("should throw InvalidCredentialsError if user not found", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: "unknown@example.com",
        password: "Password1!",
        client: mockClient,
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("should throw InvalidCredentialsError if password is wrong", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(false);

    await expect(
      service.login({
        email: "test@example.com",
        password: "WrongPassword1!",
        client: mockClient,
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("should throw InvalidCredentialsError if user is soft-deleted", async () => {
    mocks.userRepo.findByEmail.mockResolvedValue({
      ...mockUser,
      deletedAt: past,
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    await expect(
      service.login({
        email: "test@example.com",
        password: "Password1!",
        client: mockClient,
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});

// =====================================================================
// refreshToken
// =====================================================================
describe("AuthService.refreshToken", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should rotate refresh token and return new tokens", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue(mockRefreshToken);
    mocks.refreshTokenRepo.update.mockResolvedValue(mockRefreshToken);

    const result = await service.refreshToken("raw-token");

    expect(mocks.jwtUtil.hashToken).toHaveBeenCalledWith("raw-token");
    expect(mocks.refreshTokenRepo.update).toHaveBeenCalledWith(
      "rt-1",
      expect.objectContaining({ tokenHash: "hashed-token" }),
    );
    expect(result.session.accessToken).toBe("access-token");
    expect(result.session.refreshToken).toBe("refresh-token-str");
  });

  it("should throw InvalidRefreshTokenError if token not found", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue(null);

    await expect(service.refreshToken("bad-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("should throw ExpiredRefreshTokenError if token is expired", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockRefreshToken,
      expiresAt: past,
    });

    await expect(service.refreshToken("raw-token")).rejects.toThrow(
      ExpiredRefreshTokenError,
    );
  });

  it("should throw RevokedRefreshTokenError if token is revoked", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockRefreshToken,
      revokedAt: past,
    });

    await expect(service.refreshToken("raw-token")).rejects.toThrow(
      RevokedRefreshTokenError,
    );
  });

  it("should throw SessionExpiredError if session has expired", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockRefreshToken,
      session: { ...mockSession, expiresAt: past },
    });

    await expect(service.refreshToken("raw-token")).rejects.toThrow(
      SessionExpiredError,
    );
  });

  it("should throw SessionRevokedError if session is revoked", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockRefreshToken,
      session: { ...mockSession, revokedAt: past },
    });

    await expect(service.refreshToken("raw-token")).rejects.toThrow(
      SessionRevokedError,
    );
  });

  it("should throw InvalidCredentialsError if user is deleted", async () => {
    mocks.refreshTokenRepo.findByTokenHash.mockResolvedValue({
      ...mockRefreshToken,
      session: {
        ...mockSession,
        user: { ...mockUser, deletedAt: past },
      },
    });

    await expect(service.refreshToken("raw-token")).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});

// =====================================================================
// logout
// =====================================================================
describe("AuthService.logout", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should revoke the session and its refresh token", async () => {
    mocks.sessionRepo.revoke.mockResolvedValue({ count: 1 });
    mocks.refreshTokenRepo.revokeBySessionId.mockResolvedValue({ count: 1 });

    await service.logout("session-1");

    expect(mocks.sessionRepo.revoke).toHaveBeenCalledWith("session-1");
    expect(mocks.refreshTokenRepo.revokeBySessionId).toHaveBeenCalledWith(
      "session-1",
    );
  });
});

// =====================================================================
// logoutAll
// =====================================================================
describe("AuthService.logoutAll", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should revoke all sessions and refresh tokens for the user", async () => {
    mocks.sessionRepo.revokeAllByUserId.mockResolvedValue({ count: 3 });
    mocks.refreshTokenRepo.revokeByUserId.mockResolvedValue({ count: 3 });

    await service.logoutAll("user-1");

    expect(mocks.sessionRepo.revokeAllByUserId).toHaveBeenCalledWith("user-1");
    expect(mocks.refreshTokenRepo.revokeByUserId).toHaveBeenCalledWith(
      "user-1",
    );
  });
});
