import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types";
import ProjectRepository from "./repository/project.repository";
import {
  ProjectAccessDeniedError,
  ProjectNotFoundError,
} from "./project.errors";
import { ProjectCreateDto } from "./dto/ProjectCreateDto";
import { ProjectUpdateDto } from "./dto/ProjectUpdateDto";

@injectable()
export default class ProjectService {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly projectRepo: ProjectRepository,
  ) {}

  async createProject(userId: string, data: ProjectCreateDto) {
    const project = await this.projectRepo.create({
      name: data.name,
      userId,
    });
    return { project };
  }

  async getProjectById(userId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError("Project not found");
    }
    if (project.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }
    return { project };
  }

  async getUserProjects(userId: string) {
    const projects = await this.projectRepo.findByUserId(userId);
    return { projects };
  }

  async updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdateDto,
  ) {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError("Project not found");
    }
    if (project.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }

    const updatedProject = await this.projectRepo.update(projectId, data);
    return { project: updatedProject };
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError("Project not found");
    }
    if (project.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }

    await this.projectRepo.delete(projectId);
  }
}
