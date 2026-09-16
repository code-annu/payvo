import { AppError } from "@payvo/shared/error";
import InternalErrorCode from "./InternalErrorCode.js";
import { HttpStatusCode } from "@payvo/shared/http";

export class MissingInternalSecretError extends AppError {
  constructor() {
    super({
      message: "Internal secret is required",
      code: InternalErrorCode.MISSING_INTERNAL_SECRET,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}

export class InvalidInternalSecretError extends AppError {
  constructor() {
    super({
      message: "Internal secret is invalid",
      code: InternalErrorCode.INVALID_INTERNAL_SECRET,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}
