import "reflect-metadata";
import type UserRepository from "../repository/user.repository.js";
import { UserNotFoundError } from "../error/user.errors.js";
import type { User } from "../entity/user.entity.js";

vi.mock("@payvo/database/client", () => ({ client: {} }));
vi.mock("@payvo/database/types", () => ({}));

import UserService from "../user.service.js";

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

function createMockUserRepo(): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailIncludingDeleted: vi.fn(),
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

describe("UserService.getUser", () => {
  let userService: UserService;
  let userRepo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepo = createMockUserRepo();
    userService = new (UserService as any)(userRepo, {
      invalidateCachedUser: vi.fn(),
      getCachedUser: vi.fn(),
    });
  });

  it("should return the user when found", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(fakeUser);

    const result = await userService.getUser("user-1");

    expect(userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(result).toStrictEqual(fakeUser);
  });

  it("should throw UserNotFoundError when the user does not exist", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(userService.getUser("non-existent")).rejects.toThrow(
      UserNotFoundError,
    );
    await expect(userService.getUser("non-existent")).rejects.toThrow(
      "User not found",
    );
  });

  it("should propagate repository errors", async () => {
    vi.mocked(userRepo.findById).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(userService.getUser("user-1")).rejects.toThrow(
      "DB connection lost",
    );
  });
});
