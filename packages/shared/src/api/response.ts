export function buildSuccessResponse<T>(data: T, message: string) {
  return { success: true, message, data };
}

export function buildErrorResponse(input: {
  code: string;
  message: string;
  details?: unknown;
}) {
  const { message, details, code } = input;
  return { success: false, error: { code, message, details } };
}

export type SuccessResponseType<T> = ReturnType<typeof buildSuccessResponse<T>>;
export type ErrorResponseType = ReturnType<typeof buildErrorResponse>;
