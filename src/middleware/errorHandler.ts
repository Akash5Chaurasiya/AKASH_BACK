import { Request, Response, NextFunction } from "express";

class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err: ErrorHandler, req: Request, resp: Response, next: NextFunction): Response => {
  return resp.status(err.statusCode || 400).json({
    success: false,
    message: err.message,
  });
};

export default ErrorHandler;