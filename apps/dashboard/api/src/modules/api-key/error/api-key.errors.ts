import { AppError } from "@payvo/shared/error";
import ApiKeyErrorCode from "./ApiKeyErrorCode.js";
import { StatusCode } from "@payvo/shared/http";

export class ApiKeyAlreadyExistsError extends AppError {
  constructor(message: string = "API Key already exists for this environment") {
    super({
      message,
      code: ApiKeyErrorCode.API_KEY_ALREADY_EXISTS,
      statusCode: StatusCode.Error.CONFLICT,
    });
  }
}

export class ApiKeyNotFoundError extends AppError {
  constructor(message: string = "API Key not found") {
    super({
      message,
      code: ApiKeyErrorCode.API_KEY_NOT_FOUND,
      statusCode: StatusCode.Error.NOT_FOUND,
    });
  }
}