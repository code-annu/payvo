export default class AppError extends Error {
  statusCode: number;
  message: string;
  isOperational: boolean;
  code: string;
  details: any;

  constructor(input: AppErrorInput) {
    const { message, statusCode, code, details, isOperational } = input;
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational ?? true;
    this.code = code;
    this.details = details;
  }
}

interface AppErrorInput {
  message: string;
  statusCode: number;
  code: string;
  details?: any;
  isOperational?: boolean;
}
