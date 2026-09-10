import { cookieConfig } from "@payvo/config/cookie";
import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { CookieOptions, Request, Response } from "express";
import { differenceInDays } from "date-fns";
import TYPES from "@/core/di/inversify.types";
import catchAsync from "@/core/handlers/async.catch";
import AuthService from "./auth.service";
import ClientInfoUtil from "@/core/utils/client.util";
import { AuthRequest } from "@/core/middleware/authenticate.middleware";

const COOKIE_PATH = "/api/auth/rotate-token";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: AuthService,
    @inject(TYPES.ClientInfoUtil)
    private readonly clientInfoUtil: ClientInfoUtil,
  ) {}

  postSignup = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);
    const result = await this.authService.signup({ ...req.body, client });

    const maxAgeDays = differenceInDays(result.session.expiresAt, new Date());
    const cookie = cookieConfig.refreshToken(maxAgeDays, COOKIE_PATH);
    res.cookie(
      cookie.key,
      result.refreshToken,
      cookie.options as CookieOptions,
    );

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse({ accessToken: result.accessToken }));
  });

  postLogin = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);
    const result = await this.authService.login({ ...req.body, client });

    const maxAgeDays = differenceInDays(result.session.expiresAt, new Date());
    const cookie = cookieConfig.refreshToken(maxAgeDays, COOKIE_PATH);
    res.cookie(
      cookie.key,
      result.refreshToken,
      cookie.options as CookieOptions,
    );

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse({ accessToken: result.accessToken }));
  });

  postRotateToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies[cookieConfig.refreshToken(0, "").key];
    const result = await this.authService.rotateToken(refreshToken);

    const maxAgeDays = differenceInDays(result.session.expiresAt, new Date());
    const cookie = cookieConfig.refreshToken(maxAgeDays, COOKIE_PATH);
    res.cookie(
      cookie.key,
      result.refreshToken,
      cookie.options as CookieOptions,
    );

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse({ accessToken: result.accessToken }));
  });

  postLogout = catchAsync(async (req: AuthRequest, res: Response) => {
    const sid = req.auth!.sid;
    await this.authService.logout(sid);
    res.clearCookie(cookieConfig.refreshToken(0, COOKIE_PATH).key);
    res.status(HttpStatusCode.Success.NO_CONTENT).end();
  });
}
