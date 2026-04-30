/**
 * Logger port — allows application layer to log without
 * directly depending on infrastructure (pino, console, etc.).
 */
export interface Logger {
  info(obj: Record<string, unknown>, msg: string): void
  warn(obj: Record<string, unknown>, msg: string): void
  error(obj: Record<string, unknown>, msg: string): void
  debug(obj: Record<string, unknown>, msg: string): void
}
