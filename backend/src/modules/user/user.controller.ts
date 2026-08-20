import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types";
import UserService from "./user.service";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { REFRESH_TOKEN_COOKIE } from "@/core/config/cookie";
import { AuthRequest } from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class UserController {
  constructor(
    @inject(TYPES.UserService) private readonly userService: UserService,
  ) {}

  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const { user } = await this.userService.getMe(userId);

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          companyName: user.companyName,
          isEmailVerified: user.isEmailVerified,
        },
      }),
    );
  });

  updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    const { user } = await this.userService.updateMe(userId, req.body);

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          companyName: user.companyName,
          isEmailVerified: user.isEmailVerified,
        },
      }),
    );
  });

  deleteMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    await this.userService.deleteMe(userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE.KEY, REFRESH_TOKEN_COOKIE.OPTIONS);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
