import { beforeEach, describe, expect, it, vi } from "vitest";
import RotateTokenUsecase from "../application/usecase/RotateTokenUsecase.js";
import {
  ExpiredSessionError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RevokedRefreshTokenError,
  SessionRevokedError,
} from "../error/auth.errors.js";

const mocks = vi.hoisted(() => ({
  dbTransaction: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
  signAccessToken: vi.fn(),
}));

vi.mock("@payvo/database/client", () => ({ dbTransaction: mocks.dbTransaction }));
vi.mock("@payvo/shared/refresh-token", () => ({
  generateRefreshToken: mocks.generateRefreshToken,
  hashRefreshToken: mocks.hashRefreshToken,
}));
vi.mock("@payvo/shared/jwt", () => ({
  signAccessToken: mocks.signAccessToken,
}));

describe("RotateTokenUsecase", () => {
  const tx = { id: "transaction" };
  const sessionRepository = { extendExpiryDate: vi.fn() };
  const refreshTokenRepository = {
    findForRotation: vi.fn(),
    revoke: vi.fn(),
    create: vi.fn(),
  };
  const usecase = new RotateTokenUsecase(
    sessionRepository as never,
    refreshTokenRepository as never,
  );

  const activeToken = {
    id: "refresh-1",
    tokenHash: "stored-hash",
    revokedAt: null,
    session: {
      id: "session-1",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: { id: "user-1", deletedAt: null },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbTransaction.mockImplementation(async (callback) => callback(tx));
    mocks.hashRefreshToken.mockReturnValue("hashed-input-token");
    mocks.generateRefreshToken.mockReturnValue("new-refresh-token");
    mocks.hashRefreshToken.mockReturnValueOnce("hashed-input-token");
    mocks.hashRefreshToken.mockReturnValueOnce("hashed-new-token");
    mocks.signAccessToken.mockResolvedValue("new-access-token");
    refreshTokenRepository.findForRotation.mockResolvedValue(activeToken);
    refreshTokenRepository.revoke.mockResolvedValue({ id: "refresh-1" });
    refreshTokenRepository.create.mockResolvedValue({ id: "refresh-2" });
    sessionRepository.extendExpiryDate.mockResolvedValue({ id: "session-1" });
  });

  it("revokes the old token, creates a replacement, and extends the session", async () => {
    await expect(usecase.execute("old-refresh-token")).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    expect(mocks.dbTransaction).toHaveBeenCalledOnce();
    expect(refreshTokenRepository.findForRotation).toHaveBeenCalledWith(
      tx,
      "hashed-input-token",
    );
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: "refresh-1", now: expect.any(Date) }),
    );
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      { sessionId: "session-1", tokenHash: "hashed-new-token" },
      tx,
    );
    expect(sessionRepository.extendExpiryDate).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: "session-1", now: expect.any(Date) }),
    );
  });

  it("rejects an unknown refresh token", async () => {
    refreshTokenRepository.findForRotation.mockResolvedValue(null);

    await expect(usecase.execute("missing-token")).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });

  it("rejects a revoked refresh token", async () => {
    refreshTokenRepository.findForRotation.mockResolvedValue({
      ...activeToken,
      revokedAt: new Date(),
    });

    await expect(usecase.execute("revoked-token")).rejects.toBeInstanceOf(
      RevokedRefreshTokenError,
    );
  });

  it.each([
    ["an expired session", { expiresAt: new Date(Date.now() - 1) }, ExpiredSessionError],
    ["a revoked session", { revokedAt: new Date() }, SessionRevokedError],
    ["a deleted user", { user: { id: "user-1", deletedAt: new Date() } }, InvalidCredentialsError],
  ])("rejects %s", async (_reason, changes, errorType) => {
    refreshTokenRepository.findForRotation.mockResolvedValue({
      ...activeToken,
      session: { ...activeToken.session, ...changes },
    });

    await expect(usecase.execute("invalid-token")).rejects.toBeInstanceOf(
      errorType,
    );
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });

  it("rejects when the old token was already rotated", async () => {
    refreshTokenRepository.revoke.mockResolvedValue(null);

    await expect(usecase.execute("old-refresh-token")).rejects.toBeInstanceOf(
      RevokedRefreshTokenError,
    );
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    expect(sessionRepository.extendExpiryDate).not.toHaveBeenCalled();
  });

  it("rejects when the session cannot be extended", async () => {
    sessionRepository.extendExpiryDate.mockResolvedValue(null);

    await expect(usecase.execute("old-refresh-token")).rejects.toBeInstanceOf(
      SessionRevokedError,
    );
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();
  });
});
