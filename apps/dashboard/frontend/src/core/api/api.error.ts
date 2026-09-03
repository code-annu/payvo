import { isAxiosError, type AxiosError } from "axios";

export class ApiError {
  readonly message: string;
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(error: AxiosError | Error) {
    if (isAxiosError(error)) {
      const responseData = error.response?.data as
        | { error?: { message?: string; code?: string; details?: unknown }; message?: string }
        | undefined;

      this.message =
        responseData?.error?.message ||
        responseData?.message ||
        error.message ||
        "Something went wrong";
      this.code =
        responseData?.error?.code ||
        error.code ||
        "API_ERROR";
      this.statusCode = error.response?.status ?? 500;
      this.details = responseData?.error?.details;
    } else {
      this.message = error.message || "Something went wrong";
      this.code = "SOMETHING_WENT_WRONG";
      this.statusCode = 500;
    }
  }
}
