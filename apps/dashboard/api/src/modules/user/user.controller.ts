import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import UserService from "./user.service.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";

@injectable()
export default class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly userService: UserService,
  ) {}

  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const user = await this.userService.getUser(userId);

    res.status(HttpStatusCode.Success.OK).json(
      buildSuccessResponse({
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    );
  });

  patchMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const user = await this.userService.updateUser({ ...req.body, id: userId });

    res.status(HttpStatusCode.Success.OK).json(
      buildSuccessResponse({
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    );
  });

  deleteMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    await this.userService.deleteUser(userId);
    res.status(HttpStatusCode.Success.NO_CONTENT).end();
  });
}
