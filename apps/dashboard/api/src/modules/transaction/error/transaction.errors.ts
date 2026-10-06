import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import TransactionErrorCode from "./TransactionErrorCode.js";

export class TransactionNotFoundError extends AppError {
  constructor(message: string = "Transaction not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: TransactionErrorCode.TRANSACTION_NOT_FOUND,
    });
  }
}
