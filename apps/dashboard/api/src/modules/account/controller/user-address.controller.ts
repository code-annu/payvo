import { buildSuccessResponse, StatusCode } from "@payvo/shared/api";
import { BadRequestError } from "@payvo/shared/error";
import { Response } from "express";
import { inject, injectable } from "inversify";
import { catchAsync } from "@payvo/http/handler";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import UserAddressService from "../application/service/user-address.service.js";
import { AccountTypes } from "../account.types.js";
import UserAddressMapper from "../mapper/user-address.mapper.js";

@injectable()
export default class UserAddressController {
  constructor(
    @inject(AccountTypes.UserAddressService)
    private readonly userAddressService: UserAddressService,
    @inject(AccountTypes.UserAddressMapper)
    private readonly mapper: UserAddressMapper,
  ) {}

  postAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const address = await this.userAddressService.addAddress({
      ...req.body,
      userId: req.auth!.sub,
    });

    const responseData = this.mapper.mapToUserAddressResponse(address);

    res
      .status(StatusCode.Success.CREATED)
      .json(buildSuccessResponse(responseData, "Address created successfully"));
  });

  getAddresses = catchAsync(async (req: AuthRequest, res: Response) => {
    const addresses = await this.userAddressService.getAllAddresses(
      req.auth!.sub,
    );

    const responseData = this.mapper.mapToUserAddressesResponse(addresses);

    res
      .status(StatusCode.Success.OK)
      .json(
        buildSuccessResponse(responseData, "Addresses fetched successfully"),
      );
  });

  patchAddress = catchAsync(async (req: AuthRequest, res: Response) => {
    const address = await this.userAddressService.updateAddress({
      ...req.body,
      userId: req.auth!.sub,
      addressId: this.getAddressId(req),
    });

    const responseData = this.mapper.mapToUserAddressResponse(address);

    res
      .status(StatusCode.Success.OK)
      .json(buildSuccessResponse(responseData, "Address updated successfully"));
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
