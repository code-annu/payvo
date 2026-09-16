import "reflect-metadata";
import type UserRepository from "../repository/user.repository.js";
import { UserNotFoundError } from "../error/user.errors.js";
import type { UpdateUserDto } from "../dto/UpdateUserDto.js";
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

const updateInput: UpdateUserDto = {
  id: "user-1",
  fullname: "Jane Doe",
  companyName: "New Corp",
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
// Tests – updateUser
// ---------------------------------------------------------------------------

describe("UserService.updateUser", () => {
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

  it("should update and return the user on valid input", async () => {
    const updatedUser: User = {
      ...fakeUser,
      fullname: "Jane Doe",
      companyName: "New Corp",
      updatedAt: new Date("2026-09-10T01:00:00.000Z"),
    };

    vi.mocked(userRepo.update).mockResolvedValue(updatedUser);

    const result = await userService.updateUser(updateInput);

    expect(result).toStrictEqual(updatedUser);
  });

  it("should call userRepo.update with the correct id and fields", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(fakeUser);

    await userService.updateUser(updateInput);

    expect(userRepo.update).toHaveBeenCalledOnce();
    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      fullname: "Jane Doe",
      companyName: "New Corp",
    });
  });

  it("should pass only update fields (without id) to userRepo.update", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(fakeUser);

    await userService.updateUser(updateInput);

    expect(userRepo.update).toHaveBeenCalledOnce();
    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      fullname: "Jane Doe",
      companyName: "New Corp",
    });
  });

  it("should handle partial update with only fullname", async () => {
    const partialInput: UpdateUserDto = { id: "user-1", fullname: "Jane Doe" };

    vi.mocked(userRepo.update).mockResolvedValue({
      ...fakeUser,
      fullname: "Jane Doe",
    });

    const result = await userService.updateUser(partialInput);

    expect(result.fullname).toBe("Jane Doe");
    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      fullname: "Jane Doe",
    });
  });

  it("should handle setting companyName to null", async () => {
    const nullCompanyInput: UpdateUserDto = {
      id: "user-1",
      companyName: null,
    };

    vi.mocked(userRepo.update).mockResolvedValue({
      ...fakeUser,
      companyName: null,
    });

    const result = await userService.updateUser(nullCompanyInput);

    expect(result.companyName).toBeNull();
    expect(userRepo.update).toHaveBeenCalledWith("user-1", {
      companyName: null,
    });
  });

  // -----------------------------------------------------------------------
  // User not found
  // -----------------------------------------------------------------------

  it("should throw UserNotFoundError when user does not exist", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(null);

    await expect(userService.updateUser(updateInput)).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it("should throw UserNotFoundError when update returns null", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(null);

    await expect(userService.updateUser(updateInput)).rejects.toThrow(
      UserNotFoundError,
    );
  });

  // -----------------------------------------------------------------------
  // Soft-deleted user (repo update uses where deletedAt: null, returns null)
  // -----------------------------------------------------------------------

  it("should throw UserNotFoundError when user is soft-deleted", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(null);

    await expect(userService.updateUser(updateInput)).rejects.toThrow(
      UserNotFoundError,
    );
  });

  // -----------------------------------------------------------------------
  // Propagation of repository errors
  // -----------------------------------------------------------------------

  it("should propagate errors thrown by userRepo.update", async () => {
    vi.mocked(userRepo.update).mockRejectedValue(
      new Error("DB connection lost"),
    );

    await expect(userService.updateUser(updateInput)).rejects.toThrow(
      "DB connection lost",
    );
  });

  it("should propagate unexpected errors thrown by userRepo.update", async () => {
    vi.mocked(userRepo.update).mockRejectedValue(
      new Error("Update failed"),
    );

    await expect(userService.updateUser(updateInput)).rejects.toThrow(
      "Update failed",
    );
  });

  // -----------------------------------------------------------------------
  // Execution order
  // -----------------------------------------------------------------------

  it("should call userRepo.update exactly once", async () => {
    vi.mocked(userRepo.update).mockResolvedValue(fakeUser);

    await userService.updateUser(updateInput);

    expect(userRepo.update).toHaveBeenCalledOnce();
  });
});
