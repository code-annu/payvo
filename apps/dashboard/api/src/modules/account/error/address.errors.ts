import { StatusCode } from "@payvo/shared/api";
import { AppError } from "@payvo/shared/error";

export enum AddressErrorCode {
  ADDRESS_NOT_FOUND = "ADDRESS_NOT_FOUND",
}

export class AddressNotFoundError extends AppError {
  constructor(message = "Address not found") {
    super({
      message,
      code: AddressErrorCode.ADDRESS_NOT_FOUND,
      statusCode: StatusCode.Error.NOT_FOUND,
    });
  }
}
