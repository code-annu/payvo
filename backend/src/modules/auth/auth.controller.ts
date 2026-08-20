import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import TYPES from "@/core/di/inversify.types";
import AuthService from "./auth.service";
import ClientInfoUtil from "@/shared/util/client-info.util";
import buildSuccessResponse from "@/core/api/success.response";
import catchAsync from "@/core/error/async.catch";
import StatusCode from "@/core/api/StatusCode";
import { REFRESH_TOKEN_COOKIE } from "@/core/config/cookie";
import { AuthRequest } from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: AuthService,
    @inject(TYPES.ClientInfoUtil)
    private readonly clientInfoUtil: ClientInfoUtil,
  ) {}

  signup = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);
    const { user, session } = await this.authService.signup({
      ...req.body,
      client,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE.KEY,
      session.refreshToken,
      REFRESH_TOKEN_COOKIE.OPTIONS,
    );

    res.status(StatusCode.Success.CREATED).json(
      buildSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken: session.accessToken,
      }),
    );
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const client = this.clientInfoUtil.getClientInfo(req);
    const { user, session } = await this.authService.login({
      ...req.body,
      client,
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE.KEY,
      session.refreshToken,
      REFRESH_TOKEN_COOKIE.OPTIONS,
    );

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken: session.accessToken,
      }),
    );
  });

  refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies[REFRESH_TOKEN_COOKIE.KEY];
    const { session } = await this.authService.refreshToken(token);

    res.cookie(
      REFRESH_TOKEN_COOKIE.KEY,
      session.refreshToken,
      REFRESH_TOKEN_COOKIE.OPTIONS,
    );

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse({ accessToken: session.accessToken }));
  });

  logout = catchAsync(async (req: AuthRequest, res: Response) => {
    const sessionId = req.auth!.sid;
    await this.authService.logout(sessionId);

    res.clearCookie(REFRESH_TOKEN_COOKIE.KEY, REFRESH_TOKEN_COOKIE.OPTIONS);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });

  logoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub;
    await this.authService.logoutAll(userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE.KEY, REFRESH_TOKEN_COOKIE.OPTIONS);

    res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
