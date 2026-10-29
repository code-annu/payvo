import { beforeEach, describe, expect, it, vi } from "vitest";
import { jwtConfig, sessionConfig } from "@payvo/config/auth";
import { dbTransaction } from "@payvo/database/client";
import { hashPassword, verifyPassword } from "@payvo/shared/crypto";
import { signAccessToken } from "@payvo/shared/jwt";
import { addMinutes } from "date-fns";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@payvo/shared/refresh-token";
import AuthService from "./application/auth.service.js";
import * as authErrors from "./error/auth.errors.js";
import RefreshTokenRepository from "./repository/refresh-token.repository.js";
import SessionRepository from "./repository/session.repository.js";
import type { LoginInput, SignupInput } from "./schema/auth.schema.js";
import UserRepository from "../user/repository/user.repository.js";
import type { User } from "../user/entity/user.entity.js";
import type { TransactionClient } from "@payvo/database/client";

vi.mock("@payvo/config/auth", () => ({
  jwtConfig: {
    accessToken: { secret: "test-secret", expiryMinutes: 15 },
  },
  sessionConfig: { sessionExpiryDays: 30 },
}));

vi.mock("@payvo/database/client", () => ({
  dbTransaction: vi.fn(),
  prisma: {},
}));

vi.mock("@payvo/shared/crypto", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@payvo/shared/jwt", () => ({
  signAccessToken: vi.fn(),
}));

vi.mock("@payvo/shared/refresh-token", () => ({
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
}));

const signupInput: SignupInput = {
  email: "customer@example.com",
  password: "Correct-Horse-Battery-Staple",
  client: {
    userAgent: "Payvo Test Browser",
    ipAddress: "192.0.2.1",
  },
};

const loginInput: LoginInput = {
  email: signupInput.email,
  password: signupInput.password,
  client: signupInput.client,
};

const createdUser: User = {
  id: "user-123",
  email: signupInput.email,
  passwordHash: "hashed-password",
  emailVerifiedAt: null,
  passwordChangedAt: null,
  deletedAt: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

const createdSession = {
  id: "session-456",
  userId: createdUser.id,
  userAgent: signupInput.client.userAgent,
  ipAddress: signupInput.client.ipAddress,
  revokedAt: null,
  expiresAt: new Date("2025-02-01T00:00:00.000Z"),
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

const createdRefreshToken = {
  id: "refresh-789",
  sessionId: createdSession.id,
  tokenHash: "hashed-refresh-token",
  revokedAt: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
};

const issuedTokens = {
  accessToken: {
    token: "signed-access-token",
    expiresAt: expect.any(Date),
  },
  refreshToken: "raw-refresh-token",
};

function createAuthServiceTestContext() {
  const userRepo = new UserRepository();
  const sessionRepo = new SessionRepository();
  const refreshTokenRepo = new RefreshTokenRepository();

  const findByEmail = vi.spyOn(userRepo, "findByEmailIncludeDeleted");
  const findActiveUserByEmail = vi.spyOn(userRepo, "findByEmail");
  const createUser = vi.spyOn(userRepo, "create");
  const createSession = vi.spyOn(sessionRepo, "create");
  const extendSessionExpiry = vi.spyOn(sessionRepo, "extendExpiryDate");
  const revokeSession = vi.spyOn(sessionRepo, "revokeById");
  const createRefreshToken = vi.spyOn(refreshTokenRepo, "create");
  const findRefreshTokenForRotation = vi.spyOn(
    refreshTokenRepo,
    "findForRotation",
  );
  const revokeRefreshToken = vi.spyOn(refreshTokenRepo, "revokeById");
  const revokeAllSessionRefreshTokens = vi.spyOn(
    refreshTokenRepo,
    "revokeAllBySessionId",
  );

  return {
    service: new AuthService(userRepo, sessionRepo, refreshTokenRepo),
    userRepo,
    sessionRepo,
    refreshTokenRepo,
    findByEmail,
    findActiveUserByEmail,
    createUser,
    createSession,
    extendSessionExpiry,
    revokeSession,
    createRefreshToken,
    findRefreshTokenForRotation,
    revokeRefreshToken,
    revokeAllSessionRefreshTokens,
  };
}

const transactionClient = {} as TransactionClient;

function mockTransaction() {
  vi.mocked(dbTransaction).mockImplementation(async (callback) =>
    callback(transactionClient),
  );
}

function createRotationRefreshToken(
  overrides: {
    revokedAt?: Date | null;
    expiresAt?: Date;
    sessionRevokedAt?: Date | null;
    userDeletedAt?: Date | null;
  } = {},
) {
  return {
    ...createdRefreshToken,
    revokedAt: overrides.revokedAt ?? null,
    session: {
      ...createdSession,
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
      revokedAt: overrides.sessionRevokedAt ?? null,
      user: {
        ...createdUser,
        deletedAt: overrides.userDeletedAt ?? null,
      },
    },
  };
}

function mockSessionAndTokenCreation(
  context: ReturnType<typeof createAuthServiceTestContext>,
) {
  context.createSession.mockResolvedValue(createdSession);
  context.createRefreshToken.mockResolvedValue(createdRefreshToken);
}

function expectAccessTokenExpiry(startedAt: Date, completedAt: Date): Date {
  const expiresAt = vi.mocked(signAccessToken).mock.calls[0]![1].expiresAt;
  if (!(expiresAt instanceof Date)) {
    throw new Error("Expected the access token expiry to be a Date");
  }

  const expectedExpiry = addMinutes(
    startedAt,
    jwtConfig.accessToken.expiryMinutes,
  );
  expect(
    Math.abs(expiresAt.getTime() - expectedExpiry.getTime()),
  ).toBeLessThan(completedAt.getTime() - startedAt.getTime() + 1);
  return expiresAt;
}

async function expectSessionAndIssuedTokens(
  context: ReturnType<typeof createAuthServiceTestContext>,
  client: SignupInput["client"],
  startedAt: Date,
  completedAt: Date,
): Promise<Date> {
  expect(context.createSession).toHaveBeenCalledOnce();
  expect(context.createSession).toHaveBeenCalledWith(
    expect.objectContaining({
      ...client,
      userId: createdUser.id,
      expiresAt: expect.any(Date),
    }),
  );
  const sessionInput = context.createSession.mock.calls[0]![0];
  const expectedExpiry = new Date(startedAt);
  expectedExpiry.setDate(
    expectedExpiry.getDate() + sessionConfig.sessionExpiryDays,
  );
  const actualExpiry =
    sessionInput.expiresAt instanceof Date
      ? sessionInput.expiresAt
      : new Date(sessionInput.expiresAt);
  expect(
    Math.abs(actualExpiry.getTime() - expectedExpiry.getTime()),
  ).toBeLessThan(completedAt.getTime() - startedAt.getTime() + 1);

  expect(generateRefreshToken).toHaveBeenCalledOnce();
  expect(hashRefreshToken).toHaveBeenCalledWith(issuedTokens.refreshToken);
  expect(context.createRefreshToken).toHaveBeenCalledWith(
    { sessionId: createdSession.id, tokenHash: "hashed-refresh-token" },
    undefined,
  );
  expect(signAccessToken).toHaveBeenCalledWith(
    { sub: createdUser.id, sid: createdSession.id },
    {
      secret: jwtConfig.accessToken.secret,
      expiresAt: expect.any(Date),
    },
  );

  return expectAccessTokenExpiry(startedAt, completedAt);
}

describe("AuthService.signup", () => {
  let context: ReturnType<typeof createAuthServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAuthServiceTestContext();

    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(generateRefreshToken).mockReturnValue("raw-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    vi.mocked(signAccessToken).mockResolvedValue("signed-access-token");
  });

  it("creates the user, session, and tokens for a new email", async () => {
    context.findByEmail.mockResolvedValue(null);
    context.createUser.mockResolvedValue(createdUser);
    mockSessionAndTokenCreation(context);

    const startedAt = new Date();
    const result = await context.service.signup(signupInput);
    const completedAt = new Date();

    expect(context.findByEmail).toHaveBeenCalledOnce();
    expect(context.findByEmail).toHaveBeenCalledWith(signupInput.email);
    expect(hashPassword).toHaveBeenCalledOnce();
    expect(hashPassword).toHaveBeenCalledWith(signupInput.password);
    expect(context.createUser).toHaveBeenCalledOnce();
    expect(context.createUser).toHaveBeenCalledWith({
      email: signupInput.email,
      passwordHash: "hashed-password",
    });

    const accessTokenExpiresAt = await expectSessionAndIssuedTokens(
      context,
      signupInput.client,
      startedAt,
      completedAt,
    );
    expect(result).toEqual({
      ...issuedTokens,
      accessToken: {
        token: issuedTokens.accessToken.token,
        expiresAt: accessTokenExpiresAt,
      },
    });
  });

  it("rejects signup when the email already belongs to an account", async () => {
    context.findByEmail.mockResolvedValue(createdUser);

    await expect(context.service.signup(signupInput)).rejects.toBeInstanceOf(
      authErrors.EmailAlreadyExistsError,
    );

    expect(context.findByEmail).toHaveBeenCalledWith(signupInput.email);
    expect(hashPassword).not.toHaveBeenCalled();
    expect(context.createUser).not.toHaveBeenCalled();
    expect(context.createSession).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
  });
});

describe("AuthService.login", () => {
  let context: ReturnType<typeof createAuthServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAuthServiceTestContext();

    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(generateRefreshToken).mockReturnValue("raw-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    vi.mocked(signAccessToken).mockResolvedValue("signed-access-token");
  });

  it("authenticates the user and creates a new session with tokens", async () => {
    context.findActiveUserByEmail.mockResolvedValue(createdUser);
    mockSessionAndTokenCreation(context);

    const startedAt = new Date();
    const result = await context.service.login(loginInput);
    const completedAt = new Date();

    expect(context.findActiveUserByEmail).toHaveBeenCalledOnce();
    expect(context.findActiveUserByEmail).toHaveBeenCalledWith(
      loginInput.email,
    );
    expect(verifyPassword).toHaveBeenCalledOnce();
    expect(verifyPassword).toHaveBeenCalledWith(
      loginInput.password,
      createdUser.passwordHash,
    );
    expect(context.findByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();

    const accessTokenExpiresAt = await expectSessionAndIssuedTokens(
      context,
      loginInput.client,
      startedAt,
      completedAt,
    );
    expect(result).toEqual({
      ...issuedTokens,
      accessToken: {
        token: issuedTokens.accessToken.token,
        expiresAt: accessTokenExpiresAt,
      },
    });
  });

  it("rejects login when the email does not match an active user", async () => {
    context.findActiveUserByEmail.mockResolvedValue(null);

    await expect(context.service.login(loginInput)).rejects.toBeInstanceOf(
      authErrors.InvalidCredentialsError,
    );

    expect(context.findActiveUserByEmail).toHaveBeenCalledWith(
      loginInput.email,
    );
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(context.createSession).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
  });

  it("rejects login when the password is incorrect", async () => {
    context.findActiveUserByEmail.mockResolvedValue(createdUser);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(context.service.login(loginInput)).rejects.toBeInstanceOf(
      authErrors.InvalidCredentialsError,
    );

    expect(context.findActiveUserByEmail).toHaveBeenCalledWith(
      loginInput.email,
    );
    expect(verifyPassword).toHaveBeenCalledWith(
      loginInput.password,
      createdUser.passwordHash,
    );
    expect(context.createSession).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
  });
});

describe("AuthService.rotateToken", () => {
  let context: ReturnType<typeof createAuthServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAuthServiceTestContext();
    mockTransaction();

    vi.mocked(generateRefreshToken).mockReturnValue("rotated-refresh-token");
    vi.mocked(hashRefreshToken).mockImplementation((token) =>
      token === "presented-refresh-token"
        ? "hashed-presented-token"
        : "hashed-rotated-token",
    );
    vi.mocked(signAccessToken).mockResolvedValue("rotated-access-token");
  });

  it("revokes the presented token, extends the session, and issues a replacement pair", async () => {
    const existingToken = createRotationRefreshToken();
    context.findRefreshTokenForRotation.mockResolvedValue(existingToken);
    context.revokeRefreshToken.mockResolvedValue({
      ...createdRefreshToken,
      revokedAt: new Date(),
    });
    context.extendSessionExpiry.mockResolvedValue(createdSession);
    context.createRefreshToken.mockResolvedValue(createdRefreshToken);

    const startedAt = new Date();
    const result = await context.service.rotateToken("presented-refresh-token");
    const completedAt = new Date();

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.findRefreshTokenForRotation).toHaveBeenCalledWith(
      transactionClient,
      "hashed-presented-token",
    );
    expect(context.revokeRefreshToken).toHaveBeenCalledOnce();
    expect(context.revokeRefreshToken).toHaveBeenCalledWith(transactionClient, {
      id: createdRefreshToken.id,
      now: expect.any(Date),
    });
    expect(context.extendSessionExpiry).toHaveBeenCalledOnce();
    expect(context.extendSessionExpiry).toHaveBeenCalledWith(
      transactionClient,
      {
        id: createdSession.id,
        now: expect.any(Date),
        expiresAt: expect.any(Date),
      },
    );

    const updatedExpiry =
      context.extendSessionExpiry.mock.calls[0]![1].expiresAt;
    const expectedExpiry = new Date(startedAt);
    expectedExpiry.setDate(
      expectedExpiry.getDate() + sessionConfig.sessionExpiryDays,
    );
    expect(
      Math.abs(updatedExpiry.getTime() - expectedExpiry.getTime()),
    ).toBeLessThan(completedAt.getTime() - startedAt.getTime() + 1);

    expect(context.createRefreshToken).toHaveBeenCalledWith(
      {
        sessionId: createdSession.id,
        tokenHash: "hashed-rotated-token",
      },
      transactionClient,
    );
    expect(signAccessToken).toHaveBeenCalledWith(
      { sub: createdUser.id, sid: createdSession.id },
      {
        secret: jwtConfig.accessToken.secret,
        expiresAt: expect.any(Date),
      },
    );
    const accessTokenExpiresAt = expectAccessTokenExpiry(
      startedAt,
      completedAt,
    );
    expect(result).toEqual({
      accessToken: {
        token: "rotated-access-token",
        expiresAt: accessTokenExpiresAt,
      },
      refreshToken: "rotated-refresh-token",
    });
  });

  it("rejects a refresh token that cannot be found", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(null);

    await expect(
      context.service.rotateToken("unknown-refresh-token"),
    ).rejects.toBeInstanceOf(authErrors.InvalidRefreshTokenError);

    expect(context.revokeRefreshToken).not.toHaveBeenCalled();
    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  it("rejects a previously revoked refresh token", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken({ revokedAt: new Date() }),
    );

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBeInstanceOf(authErrors.RevokedRefreshTokenError);

    expect(context.revokeRefreshToken).not.toHaveBeenCalled();
    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
  });

  it("rejects a token belonging to an expired session", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken({ expiresAt: new Date(Date.now() - 1) }),
    );

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBeInstanceOf(authErrors.ExpiredSessionError);

    expect(context.revokeRefreshToken).not.toHaveBeenCalled();
    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
  });

  it("rejects a token belonging to a revoked session", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken({ sessionRevokedAt: new Date() }),
    );

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBeInstanceOf(authErrors.SessionRevokedError);

    expect(context.revokeRefreshToken).not.toHaveBeenCalled();
    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
  });

  it("rejects a token belonging to a deleted user", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken({ userDeletedAt: new Date() }),
    );

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBeInstanceOf(authErrors.InvalidCredentialsError);

    expect(context.revokeRefreshToken).not.toHaveBeenCalled();
    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
  });

  it("propagates errors when the existing refresh token cannot be revoked", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken(),
    );
    const revokeError = new Error("Refresh token revocation failed");
    context.revokeRefreshToken.mockRejectedValue(revokeError);

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBe(revokeError);

    expect(context.extendSessionExpiry).not.toHaveBeenCalled();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
  });

  it("propagates errors when the session expiry cannot be extended", async () => {
    context.findRefreshTokenForRotation.mockResolvedValue(
      createRotationRefreshToken(),
    );
    context.revokeRefreshToken.mockResolvedValue(createdRefreshToken);
    const extendError = new Error("Session expiry extension failed");
    context.extendSessionExpiry.mockRejectedValue(extendError);

    await expect(
      context.service.rotateToken("presented-refresh-token"),
    ).rejects.toBe(extendError);

    expect(context.revokeRefreshToken).toHaveBeenCalledOnce();
    expect(context.createRefreshToken).not.toHaveBeenCalled();
    expect(signAccessToken).not.toHaveBeenCalled();
  });
});

describe("AuthService.logout", () => {
  let context: ReturnType<typeof createAuthServiceTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createAuthServiceTestContext();
    mockTransaction();
  });

  it("revokes all refresh tokens and the session in one transaction", async () => {
    context.revokeAllSessionRefreshTokens.mockResolvedValue();
    context.revokeSession.mockResolvedValue();

    await expect(
      context.service.logout(createdSession.id),
    ).resolves.toBeUndefined();

    expect(dbTransaction).toHaveBeenCalledOnce();
    expect(context.revokeAllSessionRefreshTokens).toHaveBeenCalledOnce();
    expect(context.revokeSession).toHaveBeenCalledOnce();

    const [, revokeTokensInput] =
      context.revokeAllSessionRefreshTokens.mock.calls[0]!;
    const [, revokeSessionInput] = context.revokeSession.mock.calls[0]!;

    expect(context.revokeAllSessionRefreshTokens).toHaveBeenCalledWith(
      transactionClient,
      { sessionId: createdSession.id, now: expect.any(Date) },
    );
    expect(context.revokeSession).toHaveBeenCalledWith(transactionClient, {
      id: createdSession.id,
      now: revokeTokensInput.now,
    });
    expect(revokeSessionInput.now).toBe(revokeTokensInput.now);
  });
});
