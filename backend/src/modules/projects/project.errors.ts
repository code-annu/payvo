import StatusCode from "@/core/api/StatusCode";
import AppError from "@/core/error/AppError";
import ProjectErrorCode from "./ProjectErrorCode";

export class ProjectNotFoundError extends AppError {
  constructor(message: string = "Project not found") {
    super({
      message,
      statusCode: StatusCode.Error.NOT_FOUND,
      code: ProjectErrorCode.PROJECT_NOT_FOUND,
    });
  }
}

export class ProjectAccessDeniedError extends AppError {
  constructor(
    message: string = "You don't have permission to access this project",
  ) {
    super({
      message,
      statusCode: StatusCode.Error.FORBIDDEN,
      code: ProjectErrorCode.PROJECT_ACCESS_DENIED,
    });
  }
}
