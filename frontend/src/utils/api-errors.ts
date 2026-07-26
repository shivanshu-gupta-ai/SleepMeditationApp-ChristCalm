export type ApiErrorKind = "network" | "unauthorized" | "http" | "config";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  detail?: unknown;

  constructor(message: string, kind: ApiErrorKind, status?: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}
