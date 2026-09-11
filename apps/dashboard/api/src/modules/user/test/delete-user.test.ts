import "reflect-metadata";
import type UserRepository from "../repository/user.repository.js";
import { UserNotFoundError, UserDeletedError } from "../error/user.errors.js";
import type { User } from "../entity/user.entity.js";

// ---------------------------------------------------------------------------
// Mock modules that would trigger database connections or env reads
// ---------------------------------------------------------------------------

vi.mock("@payvo/database/client", () => ({
  client: {},
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

const deletedUser: User = {
  ...fakeUser,
  deletedAt: new Date("2026-08-01T00:00:00.000Z"),
};

// ---------------------------------------------------------------------------
// Helpers – create mock repository instance
// ---------------------------------------------------------------------------

function createMockUserRepo(): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  } as unknown as UserRepository;
}

// ---------------------------------------------------------------------------
// Tests – deleteUser
// ---------------------------------------------------------------------------

describe("UserService.deleteUser", () => {
  let userService: UserService;
  let userRepo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = createMockUserRepo();

    // Manually construct UserService, bypassing inversify DI
    userService = new (UserService as any)(userRepo);
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it("should soft-delete the user when found and not deleted", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    await userService.deleteUser("user-1");

    expect(userRepo.softDelete).toHaveBeenCalledOnce();
    expect(userRepo.softDelete).toHaveBeenCalledWith("user-1");
  });

  it("should check user exists before deleting", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    await userService.deleteUser("user-1");

    expect(userRepo.findById).toHaveBeenCalledOnce();
    expect(userRepo.findById).toHaveBeenCalledWith("user-1");
  });

  it("should not return any value on successful deletion", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);
    vi.mocked(userRepo.softDelete).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date(),
    });

    const result = await userService.deleteUser("user-1");

    expect(result).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // User not found
  // -----------------------------------------------------------------------

  it("should throw UserNotFoundError when user does not exist", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(userService.deleteUser("non-existent")).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("should NOT call userRepo.softDelete when user is not found", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(userService.deleteUser("non-existent")).rejects.toThrow();

    expect(userRepo.softDelete).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Soft-deleted user
  // -----------------------------------------------------------------------

  it("should throw UserDeletedError when user is already soft-deleted", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(deletedUser);

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      UserDeletedError,
    );
  });

  it("should NOT call userRepo.softDelete when user is already soft-deleted", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(deletedUser);

    await expect(userService.deleteUser("user-1")).rejects.toThrow();

    expect(userRepo.softDelete).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by userRepo.findById", async () => {
    vi.mocked(userRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate errors thrown by userRepo.softDelete", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);
    vi.mocked(userRepo.softDelete).mockRejectedValue(
      new Error("Delete failed"),
    );

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      "Delete failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call operations in the correct order: findById → softDelete", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findById).mockImplementation(async () => {
      callOrder.push("findById");
      return fakeUser;
    });
    vi.mocked(userRepo.softDelete).mockImplementation(async () => {
      callOrder.push("softDelete");
      return { ...fakeUser, deletedAt: new Date() };
    });

    await userService.deleteUser("user-1");

    expect(callOrder).toEqual(["findById", "softDelete"]);
  });
});
