import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import GetAccountUsecase from "./application/usecase/GetAccountUsecase.js";
import UpdateAccountUsecase from "./application/usecase/UpdateAccountUsecase.js";
import DeleteAccountUsecase from "./application/usecase/DeleteAccountUsecase.js";

@injectable()
export default class AccountController {
  constructor(
    @inject(TYPES.GetAccountUsecase)
    private readonly getAccountUsecase: GetAccountUsecase,
    @inject(TYPES.UpdateAccountUsecase)
    private readonly updateAccountUsecase: UpdateAccountUsecase,
    @inject(TYPES.DeleteAccountUsecase)
    private readonly deleteAccountUsecase: DeleteAccountUsecase,
  ) {}

  private accountResponse(
    user: Awaited<ReturnType<GetAccountUsecase["execute"]>>,
  ) {
    const { passwordHash: _passwordHash, ...account } = user;
    return account;
  }

  getAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await this.getAccountUsecase.execute(req.auth!.sub);

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse(this.accountResponse(user)));
  });

  updateAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await this.updateAccountUsecase.execute({
      userId: req.auth!.sub,
      ...req.body,
    });

    res
      .status(HttpStatusCode.Success.OK)
      .json(buildSuccessResponse(this.accountResponse(user)));
  });

  deleteAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.deleteAccountUsecase.execute(req.auth!.sub);

    return res.status(HttpStatusCode.Success.NO_CONTENT).end();
  });
}
