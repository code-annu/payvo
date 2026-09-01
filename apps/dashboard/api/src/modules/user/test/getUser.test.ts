import { describe, it, expect, vi, beforeEach } from "vitest";
import UserService from "../user.service.js";
import type UserRepository from "../repository/user.repository.js";
import type { User } from "../entity/user.entity.js";
import { UserNotFoundError } from "../error/user.errors.js";


// ── Mock @payvo/database to prevent Prisma from connecting ─────────
vi.mock("@payvo/database", () => ({
  db: {},
}));

// ── Factories ──────────────────────────────────────────────────────
function createMockUserRepo(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createUser: vi.fn(),
    findUserById: vi.fn(),
    updateUser: vi.fn(),
    softDeleteUser: vi.fn(),
    restoreUser: vi.fn(),
    ...overrides,
  } as unknown as UserRepository;
}

// ── Fixtures ───────────────────────────────────────────────────────
const now = new Date("2026-08-30T12:00:00Z");

const fakeUser: User = {
  id: "user-1",
  email: "john@example.com",
  passwordHash: "hashed-password",
  fullname: "John Doe",
  companyName: "Acme Inc",
  isEmailVerified: false,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Tests ──────────────────────────────────────────────────────────
describe("UserService.getUserById", () => {
  let userService: UserService;
  let userRepo: ReturnType<typeof createMockUserRepo>;

  beforeEach(() => {
    userRepo = createMockUserRepo({
      findUserById: vi.fn().mockResolvedValue(fakeUser),
    });

    userService = new UserService(userRepo as UserRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return user when found and not deleted", async () => {
    const result = await userService.getUserById("user-1");

    expect(result).toEqual(fakeUser);
  });

  it("should call findUserById with correct id", async () => {
    await userService.getUserById("user-1");

    expect(userRepo.findUserById).toHaveBeenCalledWith("user-1");
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw UserNotFoundError when user is null", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    await expect(userService.getUserById("user-1")).rejects.toThrow(
      UserNotFoundError,
    );
    await expect(userService.getUserById("user-1")).rejects.toThrow(
      "User not found",
    );
  });

  it("should throw UserNotFoundError when user is soft-deleted", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date("2026-08-29T00:00:00Z"),
    });

    await expect(userService.getUserById("user-1")).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
