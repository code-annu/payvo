import "reflect-metadata";
import type UserRepository from "../../user/repository/user.repository.js";
import type SessionRepository from "../repository/session.repository.js";
import type RefreshTokenRepository from "../repository/refresh-token.repository.js";
import {
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  ExpiredSessionError,
  SessionRevokedError,
  InvalidCredentialsError,
} from "../error/auth.errors.js";
import type { Session } from "../entity/session.entity.js";
import type { RefreshToken } from "../entity/refresh-token.entity.js";
import type { RefreshTokenRotate } from "../entity/refresh-token-rotate.entity.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
    const fakeTx = Symbol("fakeTx");
    return cb(fakeTx);
  }),
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
  generateRefreshToken: vi.fn().mockReturnValue("new-raw-refresh-token-stub"),
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
import { dbTransaction } from "@payvo/database/client";
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

const fakeRotateToken: RefreshTokenRotate = {
  id: "rt-1",
  tokenHash: "hashed-refresh-token-stub",
  revokedAt: null,
  session: {
    id: "session-1",
    expiresAt: new Date("2026-09-17T00:00:00.000Z"), // 7 days in the future
    revokedAt: null,
    user: {
      id: "user-1",
      deletedAt: null,
    },
  },
};

const fakeUpdatedSession: Session = {
  id: "session-1",
  userId: "user-1",
  userAgent: "Mozilla/5.0",
  ipAddress: "127.0.0.1",
  revokedAt: null,
  expiresAt: new Date("2026-09-17T00:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
};

const fakeNewRefreshToken: RefreshToken = {
  id: "rt-2",
  tokenHash: "hashed-refresh-token-stub",
  sessionId: "session-1",
  revokedById: null,
  revokedAt: null,
  createdAt: now,
};

const rawInputToken = "incoming-raw-refresh-token";

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
    extendExpiryDate: vi.fn(),
  } as unknown as SessionRepository;
}

function createMockRefreshTokenRepo(): RefreshTokenRepository {
  return {
    create: vi.fn(),
    findForRotate: vi.fn(),
    revoke: vi.fn(),
  } as unknown as RefreshTokenRepository;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthService.rotateToken", () => {
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

  it("should return accessToken, refreshToken, and session on successful rotation", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    const result = await authService.rotateToken(rawInputToken);

    expect(result).toEqual({
      accessToken: "access-token-stub",
      refreshToken: "new-raw-refresh-token-stub",
      session: fakeUpdatedSession,
    });
  });

  // -----------------------------------------------------------------------
  // Transaction
  // -----------------------------------------------------------------------

  it("should execute all operations inside a database transaction", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(dbTransaction).toHaveBeenCalledWith(expect.any(Function));
  });

  // -----------------------------------------------------------------------
  // Token lookup – hashes incoming token before querying
  // -----------------------------------------------------------------------

  it("should hash the incoming raw token and look it up via findForRotate", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(hashRefreshToken).toHaveBeenCalledWith(rawInputToken);
    expect(refreshTokenRepo.findForRotate).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.findForRotate).toHaveBeenCalledWith(
      expect.anything(), // tx
      "hashed-refresh-token-stub",
    );
  });

  // -----------------------------------------------------------------------
  // InvalidRefreshTokenError – token not found
  // -----------------------------------------------------------------------

  it("should throw InvalidRefreshTokenError when token is not found", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(null);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("should NOT create new tokens or extend session when token is not found", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(null);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow();

    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // RevokedRefreshTokenError – token already revoked
  // -----------------------------------------------------------------------

  it("should throw RevokedRefreshTokenError when the refresh token has been revoked", async () => {
    const revokedToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      revokedAt: new Date("2026-09-09T12:00:00.000Z"),
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(revokedToken);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      RevokedRefreshTokenError,
    );
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Revoked token cannot be used for token rotation",
    );
  });

  it("should NOT create new tokens or extend session when token is revoked", async () => {
    const revokedToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      revokedAt: new Date("2026-09-09T12:00:00.000Z"),
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(revokedToken);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow();

    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // ExpiredSessionError – session has expired
  // -----------------------------------------------------------------------

  it("should throw ExpiredSessionError when the session has expired", async () => {
    const expiredSessionToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"), // in the past
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      expiredSessionToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      ExpiredSessionError,
    );
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Token belongs to an expired session, please login again",
    );
  });

  it("should NOT create new tokens or extend session when session is expired", async () => {
    const expiredSessionToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      expiredSessionToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow();

    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // SessionRevokedError – session has been revoked
  // -----------------------------------------------------------------------

  it("should throw SessionRevokedError when the session has been revoked", async () => {
    const revokedSessionToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      revokedSessionToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      SessionRevokedError,
    );
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Token belongs to a revoked session, please login again",
    );
  });

  it("should NOT create new tokens or extend session when session is revoked", async () => {
    const revokedSessionToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      revokedSessionToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow();

    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // InactiveUserError – user has been soft-deleted
  // -----------------------------------------------------------------------

  it("should throw InvalidCredentialsError when the user has been soft-deleted", async () => {
    const deletedUserToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        user: {
          ...fakeRotateToken.session.user,
          deletedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      deletedUserToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      InvalidCredentialsError,
    );
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Token belongs to a deleted user, please login again",
    );
  });

  it("should NOT create new tokens or extend session for inactive users", async () => {
    const deletedUserToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        user: {
          ...fakeRotateToken.session.user,
          deletedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      deletedUserToken,
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow();

    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // New refresh token creation
  // -----------------------------------------------------------------------

  it("should generate a new refresh token and persist its hash", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(generateRefreshToken).toHaveBeenCalledOnce();
    // hashRefreshToken is called twice: once for lookup, once for persisting new token
    expect(hashRefreshToken).toHaveBeenCalledWith("new-raw-refresh-token-stub");

    expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      {
        sessionId: fakeRotateToken.session.id,
        tokenHash: "hashed-refresh-token-stub",
      },
      expect.anything(), // tx
    );
  });

  // -----------------------------------------------------------------------
  // Old refresh token revocation
  // -----------------------------------------------------------------------

  it("should revoke the existing refresh token with revokedBy pointing to the new token", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(refreshTokenRepo.revoke).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith(
      expect.anything(), // tx
      {
        tokenId: fakeRotateToken.id,
        revokedBy: fakeNewRefreshToken.id,
      },
    );
  });

  // -----------------------------------------------------------------------
  // Session expiry extension
  // -----------------------------------------------------------------------

  it("should extend the session expiry date based on sessionConfig.sessionExpiryDays", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(sessionRepo.extendExpiryDate).toHaveBeenCalledOnce();
    expect(sessionRepo.extendExpiryDate).toHaveBeenCalledWith(
      expect.anything(), // tx
      expect.objectContaining({
        id: fakeRotateToken.session.id,
      }),
    );

    // Verify the new expiresAt is approximately 7 days from now
    const extendCall = vi.mocked(sessionRepo.extendExpiryDate).mock
      .calls[0]![1];
    const expiresAt = new Date(extendCall.expiresAt);
    const nowDate = new Date();
    const diffDays =
      (expiresAt.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7.01);
  });

  // -----------------------------------------------------------------------
  // Access token signing
  // -----------------------------------------------------------------------

  it("should sign an access token with the correct payload and config", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    await authService.rotateToken(rawInputToken);

    expect(signAccessToken).toHaveBeenCalledOnce();
    expect(signAccessToken).toHaveBeenCalledWith(
      {
        sub: fakeRotateToken.session.user.id,
        sid: fakeRotateToken.session.id,
      },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  // -----------------------------------------------------------------------
  // Return value structure
  // -----------------------------------------------------------------------

  it("should return the new raw (unhashed) refresh token string", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    const result = await authService.rotateToken(rawInputToken);

    expect(result.refreshToken).toBe("new-raw-refresh-token-stub");
    expect(result.refreshToken).not.toBe("hashed-refresh-token-stub");
  });

  it("should return the updated session from extendExpiryDate", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(
      fakeUpdatedSession,
    );

    const result = await authService.rotateToken(rawInputToken);

    expect(result.session).toStrictEqual(fakeUpdatedSession);
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by refreshTokenRepo.findForRotate", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by refreshTokenRepo.create", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockRejectedValue(
      new Error("Refresh token insert failed"),
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Refresh token insert failed",
    );
  });

  it("should propagate errors thrown by refreshTokenRepo.revoke", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(refreshTokenRepo.revoke).mockRejectedValue(
      new Error("Refresh token revocation failed"),
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Refresh token revocation failed",
    );
  });

  it("should propagate errors thrown by sessionRepo.extendExpiryDate", async () => {
    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      fakeRotateToken,
    );
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(sessionRepo.extendExpiryDate).mockRejectedValue(
      new Error("Session update failed"),
    );

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      "Session update failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: hashRefreshToken → findForRotate → generateRefreshToken → create refreshToken → revoke refreshToken → extendExpiryDate → signAccessToken", async () => {
    const callOrder: string[] = [];

    vi.mocked(hashRefreshToken).mockImplementation((..._args: unknown[]) => {
      callOrder.push("hashRefreshToken");
      return "hashed-refresh-token-stub";
    });
    vi.mocked(refreshTokenRepo.findForRotate).mockImplementation(async () => {
      callOrder.push("findForRotate");
      return fakeRotateToken;
    });
    vi.mocked(generateRefreshToken).mockImplementation(() => {
      callOrder.push("generateRefreshToken");
      return "new-raw-refresh-token-stub";
    });
    vi.mocked(refreshTokenRepo.create).mockImplementation(async () => {
      callOrder.push("createRefreshToken");
      return fakeNewRefreshToken;
    });
    vi.mocked(refreshTokenRepo.revoke).mockImplementation(async () => {
      callOrder.push("revokeRefreshToken");
    });
    vi.mocked(sessionRepo.extendExpiryDate).mockImplementation(async () => {
      callOrder.push("extendExpiryDate");
      return fakeUpdatedSession;
    });
    vi.mocked(signAccessToken).mockImplementation(async () => {
      callOrder.push("signAccessToken");
      return "access-token-stub";
    });

    await authService.rotateToken(rawInputToken);

    expect(callOrder).toEqual([
      "hashRefreshToken", // hash the incoming token for lookup
      "findForRotate",
      "generateRefreshToken",
      "hashRefreshToken", // hash the new token for persistence
      "createRefreshToken",
      "revokeRefreshToken",
      "extendExpiryDate",
      "signAccessToken",
    ]);
  });

  // -----------------------------------------------------------------------
  // Validation order – checks happen in sequence
  // -----------------------------------------------------------------------

  it("should check revokedAt before checking session expiry", async () => {
    // Token is both revoked AND has an expired session
    const bothBadToken: RefreshTokenRotate = {
      ...fakeRotateToken,
      revokedAt: new Date("2026-09-09T12:00:00.000Z"),
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(bothBadToken);

    // Should throw RevokedRefreshTokenError, not ExpiredSessionError
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      RevokedRefreshTokenError,
    );
  });

  it("should check session expiry before checking session revoked", async () => {
    // Session is both expired AND revoked
    const bothBadSession: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      bothBadSession,
    );

    // Should throw ExpiredSessionError, not SessionRevokedError
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      ExpiredSessionError,
    );
  });

  it("should check session revoked before checking inactive user", async () => {
    // Session is revoked AND user is deleted
    const revokedSessionDeletedUser: RefreshTokenRotate = {
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
        user: {
          ...fakeRotateToken.session.user,
          deletedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    };

    vi.mocked(refreshTokenRepo.findForRotate).mockResolvedValue(
      revokedSessionDeletedUser,
    );

    // Should throw SessionRevokedError, not InactiveUserError
    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(
      SessionRevokedError,
    );
  });
});
