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
// Tests – getUser
// ---------------------------------------------------------------------------

describe("UserService.getUser", () => {
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

  it("should return the user when found and not deleted", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);

    const result = await userService.getUser("user-1");

    expect(result).toStrictEqual(fakeUser);
  });

  it("should look up the user by id", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);

    await userService.getUser("user-1");

    expect(userRepo.findById).toHaveBeenCalledOnce();
    expect(userRepo.findById).toHaveBeenCalledWith("user-1");
  });

  // -----------------------------------------------------------------------
  // User not found
  // -----------------------------------------------------------------------

  it("should throw UserNotFoundError when the user does not exist", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(userService.getUser("non-existent")).rejects.toThrow(
      UserNotFoundError,
    );
    await expect(userService.getUser("non-existent")).rejects.toThrow(
      "User not found",
    );
  });

  // -----------------------------------------------------------------------
  // Soft-deleted user
  // -----------------------------------------------------------------------

  it("should throw UserDeletedError when the user has been soft-deleted", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(deletedUser);

    await expect(userService.getUser("user-1")).rejects.toThrow(
      UserDeletedError,
    );
    await expect(userService.getUser("user-1")).rejects.toThrow(
      "Account has been deactivated. Please contact support for assistance.",
    );
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by userRepo.findById", async () => {
    vi.mocked(userRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(userService.getUser("user-1")).rejects.toThrow(
      "DB connection lost",
    );
  });
});
