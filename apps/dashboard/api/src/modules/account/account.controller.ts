import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { Response } from "express";
import { inject, injectable } from "inversify";
import { catchAsync } from "@payvo/http/handler";
import TYPES from "@/core/di/inversify.types.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import AccountService from "./application/account.service.js";

@injectable()
export default class AccountController {
  constructor(
    @inject(TYPES.AccountService)
    private readonly accountService: AccountService,
  ) {}

  postAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const account = await this.accountService.createAccount({
      ...req.body,
      userId: req.auth!.sub,
    });

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(account, "Account created successfully"));
  });

  getAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const account = await this.accountService.getAccountDetails(req.auth!.sub);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(account, "Account fetched successfully"));
  });

  patchAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const account = await this.accountService.updateAccount({
      ...req.body,
      userId: req.auth!.sub,
    });

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(account, "Account updated successfully"));
  });

  deleteAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.accountService.deleteAccount(req.auth!.sub);

    return res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
