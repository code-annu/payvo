import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import AuthService from "./auth.service.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { Request, Response } from "express";
import ClientInfoUtil from "@/core/util/client.util.js";
import { REFRESH_TOKEN_COOKIE } from "@/core/config/cookie.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import { buildSuccessResponse, StatusCode } from "@payvo/shared/http";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.AuthService) private readonly service: AuthService,
    @inject(TYPES.ClientInfoUtil) private readonly clientUtil: ClientInfoUtil,
  ) {}

  postSignup = catchAsync(async (req: Request, res: Response) => {
    const body = req.body;
    const { user, accessToken, refreshToken } = await this.service.signup({
      ...body,
      ...this.clientUtil.getClientInfo(req),
    });

    const response = buildSuccessResponse({
      user: {
        id: user.id,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
    });
    res
      .status(StatusCode.Success.CREATED)
      .cookie(
        REFRESH_TOKEN_COOKIE.KEY,
        refreshToken,
        REFRESH_TOKEN_COOKIE.OPTIONS,
      )
      .json(response);
  });

  postLogin = catchAsync(async (req: Request, res: Response) => {
    const body = req.body;
    const { user, accessToken, refreshToken } = await this.service.login({
      ...body,
      ...this.clientUtil.getClientInfo(req),
    });
    const response = buildSuccessResponse({
      user: {
        id: user.id,
        fullname: user.fullname,
        companyName: user.companyName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
    });
    res
      .status(StatusCode.Success.OK)
      .cookie(
        REFRESH_TOKEN_COOKIE.KEY,
        refreshToken,
        REFRESH_TOKEN_COOKIE.OPTIONS,
      )
      .json(response);
  });

  postRotateToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE.KEY];
    const { newAccessToken, newRefreshToken } =
      await this.service.rotateToken(refreshToken);
    res
      .status(StatusCode.Success.OK)
      .cookie(
        REFRESH_TOKEN_COOKIE.KEY,
        newRefreshToken,
        REFRESH_TOKEN_COOKIE.OPTIONS,
      )
      .json(buildSuccessResponse({ accessToken: newAccessToken }));
  });

  postLogout = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    await this.service.logout(auth.sid);
    res.status(StatusCode.Success.NO_CONTENT).end();
  });

  postLogoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    await this.service.logoutAll(auth.sub);
    res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
