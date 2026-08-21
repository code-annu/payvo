import ProjectService from "./project.service";
import {
  ProjectAccessDeniedError,
  ProjectNotFoundError,
} from "./project.errors";
import { Project } from "./entity/project.entity";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date("2026-08-21T12:00:00Z");

const mockProject: Project = {
  id: "project-1",
  userId: "user-1",
  name: "My First Project",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

// ── Stub repositories ────────────────────────────────────────────────
function createMocks() {
  return {
    projectRepo: {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function createService(mocks: ReturnType<typeof createMocks>) {
  return new ProjectService(mocks.projectRepo as any);
}

// =====================================================================
// createProject
// =====================================================================
describe("ProjectService.createProject", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should create a project and return project data", async () => {
    mocks.projectRepo.create.mockResolvedValue(mockProject);

    const result = await service.createProject("user-1", {
      name: "My First Project",
    });

    expect(mocks.projectRepo.create).toHaveBeenCalledWith({
      name: "My First Project",
      userId: "user-1",
    });
    expect(result).toEqual({ project: mockProject });
  });
});

// =====================================================================
// getProjectById
// =====================================================================
describe("ProjectService.getProjectById", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return project data when project exists and belongs to user", async () => {
    mocks.projectRepo.findById.mockResolvedValue(mockProject);

    const result = await service.getProjectById("user-1", "project-1");

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(result).toEqual({ project: mockProject });
  });

  it("should throw ProjectNotFoundError if project is not found", async () => {
    mocks.projectRepo.findById.mockResolvedValue(null);

    await expect(
      service.getProjectById("user-1", "non-existent-id"),
    ).rejects.toThrow(ProjectNotFoundError);
    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("non-existent-id");
  });

  it("should throw ProjectAccessDeniedError if project belongs to another user", async () => {
    mocks.projectRepo.findById.mockResolvedValue({
      ...mockProject,
      userId: "different-user",
    });

    await expect(
      service.getProjectById("user-1", "project-1"),
    ).rejects.toThrow(ProjectAccessDeniedError);
    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
  });
});

// =====================================================================
// getUserProjects
// =====================================================================
describe("ProjectService.getUserProjects", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should return all projects belonging to the user", async () => {
    const projectsList: Project[] = [
      mockProject,
      {
        id: "project-2",
        userId: "user-1",
        name: "Second Project",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    mocks.projectRepo.findByUserId.mockResolvedValue(projectsList);

    const result = await service.getUserProjects("user-1");

    expect(mocks.projectRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ projects: projectsList });
  });

  it("should return empty array if user has no projects", async () => {
    mocks.projectRepo.findByUserId.mockResolvedValue([]);

    const result = await service.getUserProjects("user-1");

    expect(mocks.projectRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ projects: [] });
  });
});

// =====================================================================
// updateProject
// =====================================================================
describe("ProjectService.updateProject", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should update project name and return updated project", async () => {
    mocks.projectRepo.findById.mockResolvedValue(mockProject);
    const updatedProject = { ...mockProject, name: "Updated Project Name" };
    mocks.projectRepo.update.mockResolvedValue(updatedProject);

    const result = await service.updateProject("user-1", "project-1", {
      name: "Updated Project Name",
    });

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(mocks.projectRepo.update).toHaveBeenCalledWith("project-1", {
      name: "Updated Project Name",
    });
    expect(result).toEqual({ project: updatedProject });
  });

  it("should update project isActive status and return updated project", async () => {
    mocks.projectRepo.findById.mockResolvedValue(mockProject);
    const updatedProject = { ...mockProject, isActive: false };
    mocks.projectRepo.update.mockResolvedValue(updatedProject);

    const result = await service.updateProject("user-1", "project-1", {
      isActive: false,
    });

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(mocks.projectRepo.update).toHaveBeenCalledWith("project-1", {
      isActive: false,
    });
    expect(result).toEqual({ project: updatedProject });
  });

  it("should throw ProjectNotFoundError if project is not found during update", async () => {
    mocks.projectRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateProject("user-1", "non-existent-id", {
        name: "Updated Name",
      }),
    ).rejects.toThrow(ProjectNotFoundError);

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("non-existent-id");
    expect(mocks.projectRepo.update).not.toHaveBeenCalled();
  });

  it("should throw ProjectAccessDeniedError if project belongs to another user during update", async () => {
    mocks.projectRepo.findById.mockResolvedValue({
      ...mockProject,
      userId: "different-user",
    });

    await expect(
      service.updateProject("user-1", "project-1", {
        name: "Updated Name",
      }),
    ).rejects.toThrow(ProjectAccessDeniedError);

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(mocks.projectRepo.update).not.toHaveBeenCalled();
  });
});

// =====================================================================
// deleteProject
// =====================================================================
describe("ProjectService.deleteProject", () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createMocks();
    service = createService(mocks);
  });

  it("should delete project when project exists and belongs to user", async () => {
    mocks.projectRepo.findById.mockResolvedValue(mockProject);
    mocks.projectRepo.delete.mockResolvedValue(mockProject);

    await service.deleteProject("user-1", "project-1");

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(mocks.projectRepo.delete).toHaveBeenCalledWith("project-1");
  });

  it("should throw ProjectNotFoundError if project is not found during delete", async () => {
    mocks.projectRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteProject("user-1", "non-existent-id"),
    ).rejects.toThrow(ProjectNotFoundError);

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("non-existent-id");
    expect(mocks.projectRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw ProjectAccessDeniedError if project belongs to another user during delete", async () => {
    mocks.projectRepo.findById.mockResolvedValue({
      ...mockProject,
      userId: "different-user",
    });

    await expect(
      service.deleteProject("user-1", "project-1"),
    ).rejects.toThrow(ProjectAccessDeniedError);

    expect(mocks.projectRepo.findById).toHaveBeenCalledWith("project-1");
    expect(mocks.projectRepo.delete).not.toHaveBeenCalled();
  });
});

