import { describe, it, expect, vi, beforeEach } from "vitest";
import UserService from "../user.service.js";
import type UserRepository from "../repository/user.repository.js";
import type { User } from "../entity/user.entity.js";
import { UserNotFoundError } from "../error/user.errors.js";
import type { UpdateUserDto } from "../dto/UpdateUserDto.js";

// ── Mock @payvo/config so tests don't depend on real env vars ──────
vi.mock("@payvo/config", () => ({
  jwtConfig: {
    ACCESS_TOKEN: { SECRET: "test-secret", EXPIRY_MINUTE: 15 },
    REFRESH_TOKEN: { EXPIRY_DAYS: 7 },
  },
  databaseConfig: {
    DATABASE_URL: "postgresql://mock:mock@localhost:5432/test",
  },
  serverConfig: {
    DASHBOARD_API: { PORT: 3000 },
  },
}));

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

const updatedUser: User = {
  ...fakeUser,
  fullname: "Jane Doe",
  companyName: "NewCorp",
  updatedAt: new Date("2026-08-31T12:00:00Z"),
};

const updateInput: UpdateUserDto = {
  userId: "user-1",
  fullname: "Jane Doe",
  companyName: "NewCorp",
};

// ── Tests ──────────────────────────────────────────────────────────
describe("UserService.updateUser", () => {
  let userService: UserService;
  let userRepo: ReturnType<typeof createMockUserRepo>;

  beforeEach(() => {
    userRepo = createMockUserRepo({
      updateUser: vi.fn().mockResolvedValue(updatedUser),
    });

    userService = new UserService(userRepo as UserRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return updated user on success", async () => {
    const result = await userService.updateUser(updateInput);

    expect(result).toEqual(updatedUser);
  });

  it("should call repo.updateUser with correct id and updates", async () => {
    await userService.updateUser(updateInput);

    expect(userRepo.updateUser).toHaveBeenCalledWith("user-1", {
      fullname: "Jane Doe",
      companyName: "NewCorp",
    });
  });

  it("should not pass userId to the repository", async () => {
    await userService.updateUser(updateInput);

    const callArgs = vi.mocked(userRepo.updateUser).mock.calls[0];
    expect(callArgs![1]).not.toHaveProperty("userId");
  });

  it("should handle partial update with only fullname", async () => {
    const partialInput: UpdateUserDto = { userId: "user-1", fullname: "Jane Doe" };
    await userService.updateUser(partialInput);

    expect(userRepo.updateUser).toHaveBeenCalledWith("user-1", {
      fullname: "Jane Doe",
    });
  });

  it("should handle partial update with only companyName", async () => {
    const partialInput: UpdateUserDto = { userId: "user-1", companyName: "NewCorp" };
    await userService.updateUser(partialInput);

    expect(userRepo.updateUser).toHaveBeenCalledWith("user-1", {
      companyName: "NewCorp",
    });
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw UserNotFoundError when result is null", async () => {
    vi.mocked(userRepo.updateUser).mockResolvedValue(null);

    await expect(
      userService.updateUser(updateInput),
    ).rejects.toThrow(UserNotFoundError);
    await expect(
      userService.updateUser(updateInput),
    ).rejects.toThrow("User not found");
  });
});

