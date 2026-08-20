import UserService from "./user.service";
import { UserNotFoundError } from "./user.errors";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-20T12:00:00Z");
const past = new Date("2026-07-20T12:00:00Z");

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  passwordHash: "hashed-password",
  fullname: "Test User",
  companyName: null,
  isEmailVerified: false,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

// ── Stub repositories ────────────────────────────────────────────────
function createMocks() {
  return {
    userRepo: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      revokeAllSessions: vi.fn(),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new UserService(mocks.userRepo as any);
}

// =====================================================================
// getMe
// =====================================================================
describe("UserService.getMe", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return user data when user exists and is not deleted", async () => {
    mocks.userRepo.findById.mockResolvedValue(mockUser);

    const result = await service.getMe("user-1");

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ user: mockUser });
  });

  it("should throw UserNotFoundError if user is not found", async () => {
    mocks.userRepo.findById.mockResolvedValue(null);

    await expect(service.getMe("user-1")).rejects.toThrow(UserNotFoundError);
    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
  });

  it("should throw UserNotFoundError if user is soft-deleted", async () => {
    mocks.userRepo.findById.mockResolvedValue({
      ...mockUser,
      deletedAt: past,
    });

    await expect(service.getMe("user-1")).rejects.toThrow(UserNotFoundError);
    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
  });
});

// =====================================================================
// updateMe
// =====================================================================
describe("UserService.updateMe", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should update user fullname and return updated user", async () => {
    mocks.userRepo.findById.mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser, fullname: "Updated Name" };
    mocks.userRepo.update.mockResolvedValue(updatedUser);

    const result = await service.updateMe("user-1", {
      fullname: "Updated Name",
    });

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.update).toHaveBeenCalledWith("user-1", {
      fullname: "Updated Name",
    });
    expect(result).toEqual({ user: updatedUser });
  });

  it("should update user companyName and return updated user", async () => {
    mocks.userRepo.findById.mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser, companyName: "Acme Corp" };
    mocks.userRepo.update.mockResolvedValue(updatedUser);

    const result = await service.updateMe("user-1", {
      companyName: "Acme Corp",
    });

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.update).toHaveBeenCalledWith("user-1", {
      companyName: "Acme Corp",
    });
    expect(result).toEqual({ user: updatedUser });
  });

  it("should throw UserNotFoundError if user is not found during update", async () => {
    mocks.userRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateMe("user-1", { fullname: "Updated Name" }),
    ).rejects.toThrow(UserNotFoundError);

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.update).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundError if user is soft-deleted during update", async () => {
    mocks.userRepo.findById.mockResolvedValue({
      ...mockUser,
      deletedAt: past,
    });

    await expect(
      service.updateMe("user-1", { fullname: "Updated Name" }),
    ).rejects.toThrow(UserNotFoundError);

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.update).not.toHaveBeenCalled();
  });
});

// =====================================================================
// deleteMe
// =====================================================================
describe("UserService.deleteMe", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should soft delete user and revoke all sessions", async () => {
    mocks.userRepo.findById.mockResolvedValue(mockUser);
    mocks.userRepo.delete.mockResolvedValue({
      ...mockUser,
      deletedAt: now,
    });
    mocks.userRepo.revokeAllSessions.mockResolvedValue(undefined);

    await service.deleteMe("user-1");

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.delete).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.revokeAllSessions).toHaveBeenCalledWith("user-1");
  });

  it("should throw UserNotFoundError if user is not found during delete", async () => {
    mocks.userRepo.findById.mockResolvedValue(null);

    await expect(service.deleteMe("user-1")).rejects.toThrow(UserNotFoundError);

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.delete).not.toHaveBeenCalled();
    expect(mocks.userRepo.revokeAllSessions).not.toHaveBeenCalled();
  });

  it("should throw UserNotFoundError if user is already soft-deleted", async () => {
    mocks.userRepo.findById.mockResolvedValue({
      ...mockUser,
      deletedAt: past,
    });

    await expect(service.deleteMe("user-1")).rejects.toThrow(UserNotFoundError);

    expect(mocks.userRepo.findById).toHaveBeenCalledWith("user-1");
    expect(mocks.userRepo.delete).not.toHaveBeenCalled();
    expect(mocks.userRepo.revokeAllSessions).not.toHaveBeenCalled();
  });
});
