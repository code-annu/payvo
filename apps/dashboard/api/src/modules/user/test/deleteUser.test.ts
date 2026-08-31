import { describe, it, expect, vi, beforeEach } from "vitest";
import UserService from "../user.service.js";
import type UserRepository from "../repository/user.repository.js";
import type { User } from "../entity/user.entity.js";
import { UserNotFoundError } from "../error/user.errors.js";

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

// ── Tests ──────────────────────────────────────────────────────────
describe("UserService.deleteUser", () => {
  let userService: UserService;
  let userRepo: ReturnType<typeof createMockUserRepo>;

  beforeEach(() => {
    userRepo = createMockUserRepo({
      findUserById: vi.fn().mockResolvedValue(fakeUser),
      softDeleteUser: vi.fn().mockResolvedValue(undefined),
    });

    userService = new UserService(userRepo as UserRepository);
  });

  // ── Happy path ─────────────────────────────────────────────────

  it("should return user on successful soft-delete", async () => {
    const result = await userService.deleteUser("user-1");

    expect(result).toEqual(fakeUser);
  });

  it("should call findUserById with correct id", async () => {
    await userService.deleteUser("user-1");

    expect(userRepo.findUserById).toHaveBeenCalledWith("user-1");
  });

  it("should call softDeleteUser with correct id", async () => {
    await userService.deleteUser("user-1");

    expect(userRepo.softDeleteUser).toHaveBeenCalledWith("user-1");
  });

  it("should call dependencies in the correct order", async () => {
    const callOrder: string[] = [];

    vi.mocked(userRepo.findUserById).mockImplementation(async () => {
      callOrder.push("findUserById");
      return fakeUser;
    });
    vi.mocked(userRepo.softDeleteUser).mockImplementation(async () => {
      callOrder.push("softDeleteUser");
    });

    await userService.deleteUser("user-1");

    expect(callOrder).toEqual(["findUserById", "softDeleteUser"]);
  });

  // ── Error paths ────────────────────────────────────────────────

  it("should throw UserNotFoundError when user is not found", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      UserNotFoundError,
    );
    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      "User not found",
    );
  });

  it("should throw UserNotFoundError when user is already soft-deleted", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue({
      ...fakeUser,
      deletedAt: new Date("2026-08-29T00:00:00Z"),
    });

    await expect(userService.deleteUser("user-1")).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("should not call softDeleteUser when user is not found", async () => {
    vi.mocked(userRepo.findUserById).mockResolvedValue(null);

    await userService.deleteUser("user-1").catch(() => {});

    expect(userRepo.softDeleteUser).not.toHaveBeenCalled();
  });
});
