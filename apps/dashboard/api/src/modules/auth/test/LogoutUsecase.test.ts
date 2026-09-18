import { beforeEach, describe, expect, it, vi } from "vitest";
import LogoutUsecase from "../application/usecase/LogoutUsecase.js";

const mocks = vi.hoisted(() => ({
  dbTransaction: vi.fn(),
}));

vi.mock("@payvo/database/client", () => ({ dbTransaction: mocks.dbTransaction }));

describe("LogoutUsecase", () => {
  const tx = { id: "transaction" };
  const sessionRepository = { revokeForLogout: vi.fn() };
  const refreshTokenRepository = { revokeForLogout: vi.fn() };
  const usecase = new LogoutUsecase(
    sessionRepository as never,
    refreshTokenRepository as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbTransaction.mockImplementation(async (callback) => callback(tx));
    refreshTokenRepository.revokeForLogout.mockResolvedValue(undefined);
    sessionRepository.revokeForLogout.mockResolvedValue(undefined);
  });

  it("revokes refresh tokens and the session in one transaction", async () => {
    const calls: string[] = [];
    refreshTokenRepository.revokeForLogout.mockImplementation(async () => {
      calls.push("refresh-token");
    });
    sessionRepository.revokeForLogout.mockImplementation(async () => {
      calls.push("session");
    });

    await expect(usecase.execute("session-1")).resolves.toBeUndefined();

    expect(mocks.dbTransaction).toHaveBeenCalledOnce();
    expect(refreshTokenRepository.revokeForLogout).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        sessionId: "session-1",
        now: expect.any(Date),
      }),
    );
    expect(sessionRepository.revokeForLogout).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: "session-1", now: expect.any(Date) }),
    );
    expect(calls).toEqual(["refresh-token", "session"]);
  });

  it("does not revoke the session when refresh-token revocation fails", async () => {
    const error = new Error("database failure");
    refreshTokenRepository.revokeForLogout.mockRejectedValue(error);

    await expect(usecase.execute("session-1")).rejects.toBe(error);
    expect(sessionRepository.revokeForLogout).not.toHaveBeenCalled();
  });
});
