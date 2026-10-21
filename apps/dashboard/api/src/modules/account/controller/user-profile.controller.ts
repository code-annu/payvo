import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { Response } from "express";
import { inject, injectable } from "inversify";
import { catchAsync } from "@payvo/http/handler";
import { AccountTypes } from "../account.types.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import AccountService from "../application/service/user-profile.service.js";
import DeleteAccountUsecase from "../application/usecase/DeleteAccountUsecase.js";
import { UserProfileResponse } from "@payvo/shared/schema/responses";
import UserProfileMapper from "../mapper/user-profile.mapper.js";

@injectable()
export default class ProfileController {
  constructor(
    @inject(AccountTypes.ProfileService)
    private readonly accountService: AccountService,
    @inject(AccountTypes.DeleteAccountUsecase)
    private readonly deleteAccountUsecase: DeleteAccountUsecase,
    @inject(AccountTypes.ProfileMapper)
    private readonly mapper: UserProfileMapper,
  ) {}

  postAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const { profile } = await this.accountService.createUserProfile({
      ...req.body,
      userId: req.auth!.sub,
    });

    const responseData: UserProfileResponse =
      this.mapper.mapToAccountResponse(profile);

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(responseData, "Account created successfully"));
  });

  getAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const { profile } = await this.accountService.getUserProfileDetails(
      req.auth!.sub,
    );

    const responseData: UserProfileResponse =
      this.mapper.mapToAccountResponse(profile);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Account fetched successfully"));
  });

  patchAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    const { userId, profile } = await this.accountService.updateUserProfile({
      ...req.body,
      userId: req.auth!.sub,
    });

    const responseData: UserProfileResponse =
      this.mapper.mapToAccountResponse(profile);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Account updated successfully"));
  });

  deleteAccount = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.deleteAccountUsecase.execute(req.auth!.sub);

    return res.status(StatusCode.Success.NO_CONTENT).end();
  });
}
