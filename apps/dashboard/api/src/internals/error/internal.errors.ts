import { AppError } from "@payvo/shared/error";
import InternalErrorCode from "./InternalErrorCode.js";
import { HttpStatusCode } from "@payvo/shared/http";

export class MissingInternalSecretError extends AppError {
  constructor(message: string = "Internal secret is required") {
    super({
      message,
      code: InternalErrorCode.MISSING_INTERNAL_SECRET,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}

export class InvalidInternalSecretError extends AppError {
  constructor(message: string = "Internal secret is invalid") {
    super({
      message,
      code: InternalErrorCode.INVALID_INTERNAL_SECRET,
      statusCode: HttpStatusCode.Error.UNAUTHORIZED,
    });
  }
}
