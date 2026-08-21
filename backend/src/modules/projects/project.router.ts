import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import ProjectController from "./project.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import { ProjectCreateSchema } from "./schema/ProjectCreateSchema";
import { ProjectUpdateSchema } from "./schema/ProjectUpdateSchema";
import authenticateUser from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class ProjectRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.ProjectController)
    private readonly projectController: ProjectController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateUser,
      validateRequest(ProjectCreateSchema),
      this.projectController.createProject,
    );

    this.router.get(
      "/",
      authenticateUser,
      this.projectController.getUserProjects,
    );

    this.router.get(
      "/:id",
      authenticateUser,
      this.projectController.getProjectById,
    );

    this.router.patch(
      "/:id",
      authenticateUser,
      validateRequest(ProjectUpdateSchema),
      this.projectController.updateProject,
    );

    this.router.delete(
      "/:id",
      authenticateUser,
      this.projectController.deleteProject,
    );
  }
}
