import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { AuthTypes } from "./auth.types.js";
import AuthService from "./application/auth.service.js";
import {
  clearRefreshCookie,
  setRefreshCookie,
} from "@/core/cookie/refresh-token.cookie.js";
import { catchAsync } from "@payvo/http/handler";
import { getClientInfo } from "@payvo/http/client";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import {
  AuthMeResponse,
  AuthTokenResponse,
} from "@payvo/shared/schema/responses";

@injectable()
export default class AuthController {
  constructor(
    @inject(AuthTypes.AuthService)
    private readonly authService: AuthService,
  ) {}

  postSignup = catchAsync(async (req: Request, res: Response) => {
    const client = getClientInfo(req);

    const { accessToken, refreshToken } = await this.authService.signup({
      ...req.body,
      client,
    });

    const responseData: AuthTokenResponse = {
      accessToken: accessToken.token,
      expiresAt: accessToken.expiresAt,
    };

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(responseData, "Signup successfully"));
  });

  postLogin = catchAsync(async (req: Request, res: Response) => {
    const client = getClientInfo(req);

    const { accessToken, refreshToken } = await this.authService.login({
      ...req.body,
      client,
    });

    const responseData: AuthTokenResponse = {
      accessToken: accessToken.token,
      expiresAt: accessToken.expiresAt,
    };

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Login successfully"));
  });

  postRotateToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.cookies;
    const { accessToken, refreshToken } =
      await this.authService.rotateToken(token);

    const responseData: AuthTokenResponse = {
      accessToken: accessToken.token,
      expiresAt: accessToken.expiresAt,
    };

    setRefreshCookie(res, refreshToken);
    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Token rotated successfully"));
  });

  postLogout = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sid: sessionId } = req.auth!;

    await this.authService.logout(sessionId);

    clearRefreshCookie(res);
    return res.status(StatusCode.Success.NO_CONTENT).end();
  });

  getMe = catchAsync(async (req: AuthRequest, res: Response) => {
    const responseData: AuthMeResponse = await this.authService.getMe(
      req.auth!.sub,
    );
    return res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(
          responseData,
          "User details retrieved successfully",
        ),
      );
  });
}
