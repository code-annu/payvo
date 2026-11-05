import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { BadRequestError } from "@payvo/shared/error";
import { Response } from "express";
import { inject, injectable } from "inversify";
import { catchAsync } from "@payvo/http/handler";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import UserAddressService from "../application/service/user-address.service.js";
import { AccountTypes } from "../account.types.js";

@injectable()
export default class UserAddressController {
  constructor(
    @inject(AccountTypes.UserAddressService)
    private readonly userAddressService: UserAddressService,
  ) {}

  postAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const address = await this.userAddressService.addAddress({
      ...req.body,
      userId: req.auth!.sub,
    });

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(address, "Address created successfully"));
  });

  getAddresses = catchAsync(async (req: AuthRequest, res: Response) => {
    const addresses = await this.userAddressService.getAllAddresses(
      req.auth!.sub,
    );

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(addresses, "Addresses fetched successfully"));
  });

  patchAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const address = await this.userAddressService.updateAddress({
      ...req.body,
      userId: req.auth!.sub,
      addressId: this.getAddressId(req),
    });

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(address, "Address updated successfully"));
  });

  deleteAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    await this.userAddressService.deleteAddress(
      req.auth!.sub,
      this.getAddressId(req),
    );

    return res.status(StatusCode.Success.NO_CONTENT).end();
  });

  private getAddressId(req: AuthRequest): string {
    const { addressId } = req.params;
    if (typeof addressId !== "string") {
      throw new BadRequestError("Missing or invalid address id");
    }

    return addressId;
  }
}
