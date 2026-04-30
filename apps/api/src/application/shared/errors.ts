export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_ERROR"

export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = "AppError"
  }
}

export const unauthorized = (m: string) => new AppError("UNAUTHORIZED", m)
export const forbidden = (m: string) => new AppError("FORBIDDEN", m)
export const notFound = (m: string) => new AppError("NOT_FOUND", m)
export const badRequest = (m: string) => new AppError("BAD_REQUEST", m)
export const conflict = (m: string) => new AppError("CONFLICT", m)
export const internalError = (m: string) => new AppError("INTERNAL_ERROR", m)
