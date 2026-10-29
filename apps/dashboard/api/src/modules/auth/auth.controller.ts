import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import AuthService from "./application/auth.service.js";
import {
  clearRefreshCookie,
  setRefreshCookie,
} from "@/core/cookie/refresh-token.cookie.js";
import { catchAsync } from "@payvo/http/handler";
import { getClientInfo } from "@payvo/http/client";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.AuthService)
    private readonly authService: AuthService,
  ) {}

  postSignup = catchAsync(async (req: Request, res: Response) => {
    const client = getClientInfo(req);

    const { accessToken, refreshToken } = await this.authService.signup({
      ...req.body,
      client,
    });

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.CREATED)
      .json(
        buildSuccessResponse(
          { accessToken: accessToken.token, expiresAt: accessToken.expiresAt },
          "Signup successfully",
        ),
      );
  });

  postLogin = catchAsync(async (req: Request, res: Response) => {
    const client = getClientInfo(req);

    const { accessToken, refreshToken } = await this.authService.login({
      ...req.body,
      client,
    });

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(
          { accessToken: accessToken.token, expiresAt: accessToken.expiresAt },
          "Login successfully",
        ),
      );
  });

  postRotateToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.cookies;
    const { accessToken, refreshToken } =
      await this.authService.rotateToken(token);

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(
          { accessToken: accessToken.token, expiresAt: accessToken.expiresAt },
          "Token rotated successfully",
        ),
      );
  });

  postLogout = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sid: sessionId } = req.auth!;

    await this.authService.logout(sessionId);

    clearRefreshCookie(res);
    return res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
