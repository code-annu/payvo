import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types";
import ProjectService from "./project.service";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { AuthRequest } from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class ProjectController {
  constructor(
    @inject(TYPES.ProjectService)
    private readonly projectService: ProjectService,
  ) {}

  createProject = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const result = await this.projectService.createProject(userId, req.body);

    res.status(StatusCode.Success.CREATED).json(buildSuccessResponse(result));
  });

  getProjectById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const projectId = req.params.id as string;
    const result = await this.projectService.getProjectById(userId, projectId);

    res.status(StatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  getUserProjects = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const result = await this.projectService.getUserProjects(userId);

    res.status(StatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  updateProject = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const projectId = req.params.id as string;
    const result = await this.projectService.updateProject(
      userId,
      projectId,
      req.body,
    );

    res.status(StatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  deleteProject = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const projectId = req.params.id as string;
    await this.projectService.deleteProject(userId, projectId);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
