import { AppError } from "@payvo/shared/error";
import { isAxiosError } from "axios";

export function mapToAppError(error: unknown): AppError {
  let appError: AppError;
  if (isAxiosError(error)) {
    appError = new AppError({
      statusCode: error.response!.status,
      message: error.response?.data.error.message,
      code: error.response?.data.error.code,
      details: error.response?.data.error.details,
    });
  } else {
    appError = new AppError({
      statusCode: 500,
      code: "INTERNAL_SERVER",
      message: "Internal server error",
    });
  }

  return appError;
}
