import "reflect-metadata";
import type UserRepository from "../repository/user.repository.js";
import { UserNotFoundError } from "../error/user.errors.js";
import type { User } from "../entity/user.entity.js";

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

import UserService from "../user.service.js";

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

// ---------------------------------------------------------------------------
// Helpers – create mock instances
// ---------------------------------------------------------------------------

function createMockUserRepo(): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailIncludingDeleted: vi.fn(),
    findByIdIncludingDeleted: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    revokeSessionsForAccountDeletion: vi.fn().mockResolvedValue({ sessionIds: [] }),
    revokeRefreshTokensForAccountDeletion: vi.fn().mockResolvedValue(undefined),
    disableMerchantForAccountDeletion: vi.fn().mockResolvedValue({ merchantIds: [] }),
    revokeApiKeysForAccountDeletion: vi.fn().mockResolvedValue(undefined),
  } as unknown as UserRepository;
}

function createMockUserCacheService() {
  return {
    invalidateCachedUser: vi.fn().mockResolvedValue(undefined),
    getCachedUser: vi.fn(),
  };
}

describe("UserService.deleteUser", () => {
  let userService: UserService;
  let userRepo: UserRepository;
  let userCacheService: ReturnType<typeof createMockUserCacheService>;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = createMockUserRepo();
    userCacheService = createMockUserCacheService();
    userService = new (UserService as any)(userRepo, userCacheService);
  });

  it("should soft-delete the user when found and not deleted", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    await userService.deleteUser("user-1");

    expect(userRepo.softDelete).toHaveBeenCalledOnce();
    expect(userRepo.softDelete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "user-1" }),
    );
  });

  it("should execute all operations inside a database transaction", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    await userService.deleteUser("user-1");

    const { dbTransaction } = await import("@payvo/database/client");
    expect(dbTransaction).toHaveBeenCalledOnce();
  });

  it("should not return any value on successful deletion", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    const result = await userService.deleteUser("user-1");

    expect(result).toBeUndefined();
  });

  it("should throw UserNotFoundError when user does not exist", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue(null);

    await expect(userService.deleteUser("non-existent")).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("should NOT call revokeSessions when softDelete returns null", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue(null);

    await expect(userService.deleteUser("non-existent")).rejects.toThrow();

    expect(userRepo.revokeSessionsForAccountDeletion).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundError when user is already soft-deleted", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue(null);

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("should NOT call revokeSessions when user is already soft-deleted", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue(null);

    await expect(userService.deleteUser("user-1")).rejects.toThrow();

    expect(userRepo.revokeSessionsForAccountDeletion).not.toHaveBeenCalled();
  });

  it("should propagate errors thrown by userRepo.softDelete", async () => {
    vi.mocked(userRepo.softDelete).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by userRepo.revokeSessionsForAccountDeletion", async () => {
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });
    vi.mocked(userRepo.revokeSessionsForAccountDeletion).mockRejectedValue(
      new Error("Delete failed"),
    );

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      "Delete failed",
    );
  });

  it("should call operations in the correct order: softDelete → revokeSessionsForAccountDeletion → disableMerchantForAccountDeletion", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.softDelete).mockImplementation(async () => {
      callOrder.push("softDelete");
      return { ...fakeUser, deletedAt: new Date() };
    });
    vi.mocked(userRepo.revokeSessionsForAccountDeletion).mockImplementation(async () => {
      callOrder.push("revokeSessions");
      return { sessionIds: [] };
    });
    vi.mocked(userRepo.disableMerchantForAccountDeletion).mockImplementation(async () => {
      callOrder.push("disableMerchant");
      return { merchantIds: [] };
    });

    await userService.deleteUser("user-1");

    expect(callOrder).toEqual([
      "softDelete",
      "revokeSessions",
      "disableMerchant",
    ]);
  });
});
