import { sessionConfig } from "@payvo/config/auth";
import { cookieConfig } from "@payvo/config/cookie";
import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { injectable, inject } from "inversify";
import { CookieOptions, Request, Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import SignupUsecase from "./application/usecase/SignupUsecase.js";
import LoginUsecase from "./application/usecase/LoginUsecase.js";
import RotateTokenUsecase from "./application/usecase/RotateTokenUsecase.js";
import LogoutUsecase from "./application/usecase/LogoutUsecase.js";
import ClientInfoUtil from "@/core/util/client.util.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";

const ROTATE_TOKEN_PATH = "/api/auth/rotate-token";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.SignupUsecase)
    private readonly signupUsecase: SignupUsecase,
    @inject(TYPES.LoginUsecase)
    private readonly loginUsecase: LoginUsecase,
    @inject(TYPES.RotateTokenUsecase)
    private readonly rotateTokenUsecase: RotateTokenUsecase,
    @inject(TYPES.LogoutUsecase)
    private readonly logoutUsecase: LogoutUsecase,
    @inject(TYPES.ClientInfoUtil)
    private readonly clientInfoUtil: ClientInfoUtil,
  ) {}

  postSignup = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);

    const { accessToken, refreshToken } = await this.signupUsecase.execute({
      ...req.body,
      client,
    });

    const cookie = cookieConfig.refreshToken(
      sessionConfig.sessionExpiryDays,
      ROTATE_TOKEN_PATH,
    );

    res
      .cookie(cookie.key, refreshToken, cookie.options as CookieOptions)
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse({ accessToken }));
  });

  postLogin = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);

    const { accessToken, refreshToken } = await this.loginUsecase.execute({
      ...req.body,
      client,
    });

    const cookie = cookieConfig.refreshToken(
      sessionConfig.sessionExpiryDays,
      ROTATE_TOKEN_PATH,
    );

    res
      .cookie(cookie.key, refreshToken, cookie.options as CookieOptions)
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse({ accessToken }));
  });

  postRotateToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.cookies;

    const { accessToken, refreshToken } =
      await this.rotateTokenUsecase.execute(token);

    const cookie = cookieConfig.refreshToken(
      sessionConfig.sessionExpiryDays,
      ROTATE_TOKEN_PATH,
    );

    res
      .cookie(cookie.key, refreshToken, cookie.options as CookieOptions)
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse({ accessToken }));
  });

  postLogout = catchAsync(async (req: AuthRequest, res: Response) => {
    const { sid: sessionId } = req.auth!;

    await this.logoutUsecase.execute(sessionId);

    const cookie = cookieConfig.refreshToken(0, ROTATE_TOKEN_PATH);

    res
      .clearCookie(cookie.key, cookie.options as CookieOptions)
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse({ message: "Logged out successfully" }));
  });
}
