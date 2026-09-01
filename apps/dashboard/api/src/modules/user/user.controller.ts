import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import UserService from "./user.service.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { Response } from "express";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/http";

@injectable()
export default class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly service: UserService,
  ) {}

  getUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const user = await this.service.getUserById(auth.sub);
    const response = buildSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    res.status(StatusCode.Success.OK).json(response);
  });

  updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const user = await this.service.updateUser({
      userId: auth.sub,
      ...req.body,
    });
    const response = buildSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    res.status(StatusCode.Success.OK).json(response);
  });

  deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const user = await this.service.deleteUser(auth.sub);
    const response = buildSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    res.status(StatusCode.Success.OK).json(response);
  });
}
