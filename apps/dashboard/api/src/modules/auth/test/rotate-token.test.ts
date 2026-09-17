import "reflect-metadata";
import type UserRepository from "../../user/repository/user.repository.js";
import type SessionRepository from "../repository/session.repository.js";
import type RefreshTokenRepository from "../repository/refresh-token.repository.js";
import {
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  SessionRevokedError,
} from "../error/auth.errors.js";
import type { RefreshToken } from "../entity/refresh-token.entity.js";
import type { RefreshTokenRotate } from "../entity/refresh-token-rotate.entity.js";
import type { Session } from "../entity/session.entity.js";

vi.mock("@payvo/database/client", () => ({
  client: {},
  dbTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock("@payvo/database/types", () => ({}));

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

import { dbTransaction } from "@payvo/database/client";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import { signAccessToken } from "@payvo/shared/jwt";
import AuthService from "../auth.service.js";

const now = new Date("2026-09-10T00:00:00.000Z");

const fakeRotateToken: RefreshTokenRotate = {
  id: "rt-1",
  tokenHash: "hashed-refresh-token-stub",
  revokedAt: null,
  session: {
    id: "session-1",
    expiresAt: new Date("2026-09-20T00:00:00.000Z"),
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
  expiresAt: new Date("2026-09-20T00:00:00.000Z"),
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

function createMockUserRepo(): UserRepository {
  return {
    findByEmail: vi.fn(),
    findByEmailIncludingDeleted: vi.fn(),
    findById: vi.fn(),
    findByIdIncludingDeleted: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    revokeSessionsForAccountDeletion: vi.fn(),
    revokeRefreshTokensForAccountDeletion: vi.fn(),
    disableMerchantForAccountDeletion: vi.fn(),
    revokeApiKeysForAccountDeletion: vi.fn(),
  } as unknown as UserRepository;
}

function createMockSessionRepo(): SessionRepository {
  return {
    create: vi.fn(),
    extendExpiryDate: vi.fn(),
    revokeForLogout: vi.fn(),
  } as unknown as SessionRepository;
}

function createMockRefreshTokenRepo(): RefreshTokenRepository {
  return {
    create: vi.fn(),
    findForRotation: vi.fn(),
    revokeForRotation: vi.fn(),
    revokeForLogout: vi.fn(),
  } as unknown as RefreshTokenRepository;
}

describe("AuthService.rotateToken", () => {
  let authService: AuthService;
  let sessionRepo: SessionRepository;
  let refreshTokenRepo: RefreshTokenRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    sessionRepo = createMockSessionRepo();
    refreshTokenRepo = createMockRefreshTokenRepo();
    authService = new (AuthService as any)(
      createMockUserRepo(),
      sessionRepo,
      refreshTokenRepo,
    );
  });

  function mockSuccessfulRotation() {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue(fakeRotateToken);
    vi.mocked(refreshTokenRepo.create).mockResolvedValue(fakeNewRefreshToken);
    vi.mocked(refreshTokenRepo.revokeForRotation).mockResolvedValue({ revoked: true });
    vi.mocked(sessionRepo.extendExpiryDate).mockResolvedValue(fakeUpdatedSession);
  }

  it("returns a new access token, refresh token, and updated session on success", async () => {
    mockSuccessfulRotation();

    await expect(authService.rotateToken(rawInputToken)).resolves.toEqual({
      accessToken: "access-token-stub",
      refreshToken: "new-raw-refresh-token-stub",
      session: fakeUpdatedSession,
    });
  });

  it("runs the entire flow inside a db transaction", async () => {
    mockSuccessfulRotation();

    await authService.rotateToken(rawInputToken);

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.findForRotation).toHaveBeenCalledWith(expect.anything(), "hashed-refresh-token-stub");
    expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
    expect(refreshTokenRepo.revokeForRotation).toHaveBeenCalledOnce();
    expect(sessionRepo.extendExpiryDate).toHaveBeenCalledOnce();
    expect(signAccessToken).toHaveBeenCalledOnce();
  });

  it("hashes the incoming refresh token before querying", async () => {
    mockSuccessfulRotation();

    await authService.rotateToken(rawInputToken);

    expect(hashRefreshToken).toHaveBeenCalledWith(rawInputToken);
    expect(refreshTokenRepo.findForRotation).toHaveBeenCalledWith(expect.anything(), "hashed-refresh-token-stub");
  });

  it("throws InvalidRefreshTokenError when no refresh token matches", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue(null);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it("throws RevokedRefreshTokenError when the refresh token has already been revoked", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      revokedAt: new Date("2026-09-09T00:00:00.000Z"),
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(RevokedRefreshTokenError);
  });

  it("throws ExpiredSessionError when the session is expired", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(ExpiredSessionError);
  });

  it("throws SessionRevokedError when the session was revoked", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-20T00:00:00.000Z"),
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
      },
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(SessionRevokedError);
  });

  it("throws InvalidCredentialsError when the user belonging to the session was deleted", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-20T00:00:00.000Z"),
        user: {
          ...fakeRotateToken.session.user,
          deletedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(InvalidCredentialsError);
  });

  it("creates a new refresh token and revokes the old one with the new token id", async () => {
    mockSuccessfulRotation();

    await authService.rotateToken(rawInputToken);

    expect(generateRefreshToken).toHaveBeenCalledOnce();
    expect(hashRefreshToken).toHaveBeenCalledTimes(2);
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      {
        sessionId: fakeRotateToken.session.id,
        tokenHash: "hashed-refresh-token-stub",
      },
      expect.anything(),
    );
    expect(refreshTokenRepo.revokeForRotation).toHaveBeenCalledWith(expect.anything(), {
      tokenId: fakeRotateToken.id,
      revokedBy: fakeNewRefreshToken.id,
    });
  });

  it("extends the session lifetime after rotating the token", async () => {
    mockSuccessfulRotation();

    await authService.rotateToken(rawInputToken);

    expect(sessionRepo.extendExpiryDate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: fakeRotateToken.session.id,
      }),
    );

    const call = vi.mocked(sessionRepo.extendExpiryDate).mock.calls[0]?.[1] as {
      id: string;
      expiresAt: Date;
      now: Date;
    };
    const diffDays = (call.expiresAt.getTime() - call.now.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7.01);
  });

  it("signs the access token with the session user and session ids", async () => {
    mockSuccessfulRotation();

    await authService.rotateToken(rawInputToken);

    expect(signAccessToken).toHaveBeenCalledWith(
      { sub: fakeRotateToken.session.user.id, sid: fakeRotateToken.session.id },
      { secret: "test-secret", expiresInMinute: 15 },
    );
  });

  it("propagates repo errors from the rotation flow", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockRejectedValue(new Error("DB connection lost"));

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow("DB connection lost");
  });

  it("does not create a new token or extend the session when validation fails", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue(null);

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(InvalidRefreshTokenError);
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.extendExpiryDate).not.toHaveBeenCalled();
  });

  it("checks for revoked refresh token before session expiry checks", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      revokedAt: new Date("2026-09-09T00:00:00.000Z"),
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(RevokedRefreshTokenError);
  });

  it("checks session expiry before revoked-session checks", async () => {
    vi.mocked(refreshTokenRepo.findForRotation).mockResolvedValue({
      ...fakeRotateToken,
      session: {
        ...fakeRotateToken.session,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        revokedAt: new Date("2026-09-08T00:00:00.000Z"),
      },
    });

    await expect(authService.rotateToken(rawInputToken)).rejects.toThrow(ExpiredSessionError);
  });
});
